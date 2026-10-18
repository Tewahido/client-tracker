import { describe, expect, it } from 'vitest'
import { findUntestedChanges } from './tests-required.mjs'

describe('findUntestedChanges', () => {
  it.each([
    ['code without tests', ['src/lib/loans.ts', 'README.md'], ['src/lib/loans.ts']],
    ['code with a unit test', ['src/lib/loans.ts', 'src/lib/loans.test.ts'], []],
    ['a migration with a database test', ['supabase/migrations/x.sql', 'supabase/tests/rls.test.ts'], []],
    ['a migration without tests', ['supabase/migrations/x.sql'], ['supabase/migrations/x.sql']],
    ['styles, barrels and type files only', ['src/a/A.styles.ts', 'src/a/index.ts', 'src/vite-env.d.ts'], []],
    ['docs and config only', ['README.md', 'AGENTS.md', 'vite.config.ts'], []],
  ])('%s', (_label, files, expected) => {
    expect(findUntestedChanges(files)).toEqual(expected)
  })
})
