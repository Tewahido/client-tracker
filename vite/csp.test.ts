import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, cspPlugin } from './csp'

const directive = (policy: string, name: string) => policy.split('; ').find((d) => d.startsWith(`${name} `))

describe('contentSecurityPolicy', () => {
  const policy = contentSecurityPolicy({ supabaseUrl: 'https://abc123.supabase.co', inlineScriptHashes: ["'sha256-xyz'"] })

  it('runs only our own scripts and the allowed inline ones', () => {
    expect(directive(policy, 'script-src')).toBe("script-src 'self' 'sha256-xyz'")
    expect(policy).not.toContain('unsafe-eval')
    expect(directive(policy, 'object-src')).toBe("object-src 'none'")
  })

  it('only talks to this site and the Supabase project, including its realtime socket', () => {
    expect(directive(policy, 'connect-src')).toBe("connect-src 'self' https://abc123.supabase.co wss://abc123.supabase.co")
  })

  it('lets the confetti library start its own worker', () => {
    expect(directive(policy, 'worker-src')).toBe("worker-src 'self' blob:")
  })

  it('keeps to this site in local mode', () => {
    expect(directive(contentSecurityPolicy({ inlineScriptHashes: [] }), 'connect-src')).toBe("connect-src 'self'")
  })
})

describe('cspPlugin', () => {
  it('adds the policy to the page with a hash for each inline script', () => {
    const inline = "\n      document.documentElement.classList.add('dark');\n    "
    const html = `<html><head>\n<script>${inline}</script>\n<script type="module" src="/main.js"></script></head></html>`
    const transform = cspPlugin('https://abc123.supabase.co').transformIndexHtml as { handler: (html: string) => string }
    const out = transform.handler(html)
    const hash = createHash('sha256').update(inline).digest('base64')
    expect(out).toContain('<meta http-equiv="Content-Security-Policy"')
    expect(out).toContain(`'sha256-${hash}'`)
  })
})
