# AGENTS.md

Rules for anyone changing this repository, human or AI agent. CI enforces the parts it can; reviewers enforce the rest.

## Non-negotiables

### 0. Never push to `main` and never merge pull requests

- All work happens on a feature branch (`feat/…`, `fix/…`, `chore/…`) and reaches `main` only through a pull request.
- **AI agents must never merge a PR**, enable auto-merge, or push to `main` in any form (`git push origin main`, `git push origin <ref>:main`, force-pushes). A human reviews and merges.
- If a task seems to need a change on `main` (e.g. a missing base branch), stop and ask the repository owner.

### 1. Every pull request has a deep but brief description

Use the template in [`.github/pull_request_template.md`](.github/pull_request_template.md). A good description lets a reviewer understand the change **without reading the diff first**:

- **Title**: Conventional Commit style, imperative, specific. `feat(loans): let owners forgive a loan`, not `updates`.
- **Why**: the problem or goal, in one or two sentences.
- **What changed**: the meaningful changes as bullets, grouped by area. Not a file list.
- **How it was tested**: the automated tests added or changed, plus anything checked by hand.
- **Risk and rollout**: migrations, permission/RLS changes, breaking changes, anything not verified.
- **Screenshots** for visible UI changes.

Brief means no filler. Deep means a reviewer learns the *why* and the *risks*, not just the *what*.

### 2. Every feature and every bug fix ships with regression tests

- **Business logic** (`src/lib/`) gets Vitest unit tests next to the code (`*.test.ts`).
- **Database changes** (`supabase/migrations/`) get Row Level Security / behaviour tests in `supabase/tests/` (PGlite runs the real migrations).
- **Bug fixes** start with a test that fails before the fix.
- If something genuinely cannot be tested automatically (pure styling, copy changes), say so in the PR under *How it was tested*, and add the `no-tests-needed` label so the *Tests required* check passes.
- Before you claim a test protects something, make it fail at least once (break the code temporarily) to prove it can.

### 3. Small, atomic commits

One logical change per commit, Conventional Commit messages (`feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`). Never mix a refactor with a behaviour change.

## Checks every PR must pass

| Check | Workflow | What it does |
| --- | --- | --- |
| Type check, lint, tests, build | `ci.yml` | `npm run typecheck`, `npm run lint` (annotated inline on the PR), `npm test`, `npm run build` |
| Tests required | `quality.yml` | Fails when `src/` or `supabase/migrations/` change without any test changes (unless labelled `no-tests-needed`) |
| Dependency review | `quality.yml` | Blocks newly added dependencies with known high-severity vulnerabilities |
| npm audit | `quality.yml` | Fails on high/critical advisories in production dependencies |
| CodeQL | `codeql.yml` | GitHub's static security and quality analysis for TypeScript |
| AI review | `ai-review.yml` | Two reviewers comment on the PR: security, and a code review that ends with a merge verdict; see [`.github/reviewers/`](.github/reviewers) |

## Project conventions

- **Components render, hooks decide.** Business logic lives in custom hooks (`features/*/hooks`, `src/hooks`) and pure functions in `src/lib/`. Components stay presentational.
- **Styling lives outside JSX.** Each component has a sibling `Component.styles.ts` exporting its Tailwind classes. No inline class strings in `.tsx` files.
- **Feature folders.** `src/features/<feature>/{components,hooks}` with an `index.ts` public surface; features import each other only through that index.
- **One data path.** UI → loan store (`providers/LoanStoreProvider`) → `DataRepository` (local storage or Supabase). Never call Supabase directly from components.
- **Money is integer cents.** Never store or add floats for amounts.
- **The database is the security boundary.** Every permission rule lives in RLS policies or triggers (with tests). `usePermissions` only hides controls that would fail.
- **Migrations are append-only once shared.** Add a new migration; don't edit one that may have been applied anywhere.

## Commands

```bash
npm run dev         # local dev server (local mode without Supabase env vars)
npm run typecheck
npm run lint
npm test            # unit + database policy tests
npm run build
```
