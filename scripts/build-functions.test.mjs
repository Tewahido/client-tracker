import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { BUNDLED_FUNCTIONS, buildFunction } from './build-functions.mjs'

const dir = mkdtempSync(join(tmpdir(), 'lendly-functions-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('buildFunction', () => {
  it.each(BUNDLED_FUNCTIONS)('bundles %s into one file Deno can run', async (name) => {
    const code = readFileSync(await buildFunction(name, join(dir, `${name}.ts`)), 'utf8')
    // Supabase deploys only the function's folder: nothing may point back into the app,
    // and packages must use Deno's npm: specifiers.
    const imports = [...code.matchAll(/(?:^|\n)\s*import\s[^;]*?from\s*["']([^"']+)["']/g)].map((m) => m[1])
    expect(imports.length).toBeGreaterThan(0)
    for (const specifier of imports) expect(specifier).toMatch(/^npm:/)
    expect(code).toContain('Deno.serve(')
  })

  it('carries the app’s own reminder rules into send-reminders', async () => {
    const code = readFileSync(await buildFunction('send-reminders', join(dir, 'rules.ts')), 'utf8')
    expect(code).toContain('loans need your attention')
    expect(code).toContain('Africa/Johannesburg')
  })
})
