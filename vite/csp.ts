import { createHash } from 'node:crypto'
import type { Plugin } from 'vite'

/** Every inline <script> body in the page, which the policy allows by hash. */
function inlineScripts(html: string): string[] {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
}

const sha256 = (text: string) => `'sha256-${createHash('sha256').update(text).digest('base64')}'`

/**
 * Content-Security-Policy for the built app. Sign-in tokens live in browser storage, so
 * this is the backstop if a script injection bug ever appears: only our own scripts run,
 * and data can only be sent to this site and the Supabase project.
 */
export function contentSecurityPolicy({ supabaseUrl, inlineScriptHashes }: { supabaseUrl?: string; inlineScriptHashes: string[] }): string {
  const supabase = supabaseUrl ? new URL(supabaseUrl) : null
  const connect = ["'self'", ...(supabase ? [supabase.origin, `wss://${supabase.host}`] : [])]
  return [
    "default-src 'self'",
    `script-src 'self' ${inlineScriptHashes.join(' ')}`.trim(),
    // Toasts and animations set inline styles; styles can't run code.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src ${connect.join(' ')}`,
    // The confetti library draws in a worker it creates from a blob: URL (only our own scripts can make those).
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

/** Adds the policy to index.html as a <meta> tag in production builds (the dev server needs inline scripts). */
export function cspPlugin(supabaseUrl: string | undefined): Plugin {
  return {
    name: 'lendly-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const policy = contentSecurityPolicy({ supabaseUrl, inlineScriptHashes: inlineScripts(html).map(sha256) })
        return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
      },
    },
  }
}
