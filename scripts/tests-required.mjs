// Fails when the branch changes application code without changing any tests.
// Compares the current branch with main (where it forked). See AGENTS.md rule 2.
//
// Usage: npm run check:tests
// Escape hatch for genuinely untestable changes (styling, copy):
//   NO_TESTS_NEEDED=1 npm run check:tests   (and explain why in the PR description)
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

/** Behavioural code: TypeScript under src/ (not styles, tests, types or barrels) and SQL migrations. */
const CODE = /^(src\/.*\.(ts|tsx)|supabase\/migrations\/.*\.sql)$/
const NOT_CODE = /\.styles\.ts$|\.test\.ts$|\.d\.ts$|\/index\.ts$/
const TEST = /\.test\.(ts|tsx|mjs)$|^supabase\/tests\//

/** Code files that changed without any accompanying test change (empty when fine). */
export function findUntestedChanges(files) {
  const code = files.filter((f) => CODE.test(f) && !NOT_CODE.test(f))
  const tests = files.filter((f) => TEST.test(f))
  return tests.length > 0 ? [] : code
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

function changedFiles() {
  // Prefer the remote main (it's what the PR targets); fall back to a local main.
  const base = ['origin/main', 'main'].find((ref) => {
    try {
      git('rev-parse', '--verify', '--quiet', ref)
      return true
    } catch {
      return false
    }
  })
  if (!base) throw new Error('No main branch found to compare against.')
  const mergeBase = git('merge-base', base, 'HEAD')
  const committed = git('diff', '--name-only', `${mergeBase}...HEAD`)
  const uncommitted = git('diff', '--name-only', 'HEAD')
  return [...new Set(`${committed}\n${uncommitted}`.split('\n').filter(Boolean))]
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.NO_TESTS_NEEDED === '1') {
    console.log('tests-required: skipped (NO_TESTS_NEEDED=1). Explain why in the PR description.')
    process.exit(0)
  }
  const untested = findUntestedChanges(changedFiles())
  if (untested.length > 0) {
    console.error('tests-required: this branch changes application code but no tests (see AGENTS.md):')
    for (const f of untested) console.error(`  ${f}`)
    console.error('Add regression tests, or run with NO_TESTS_NEEDED=1 for genuinely untestable changes.')
    process.exit(1)
  }
  console.log('tests-required: OK')
}
