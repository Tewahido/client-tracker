# AGENTS.md

Rules for anyone changing this repository, human or AI agent. Checks run **locally before every push** (there is no CI on GitHub); the pre-push hook enforces the automated parts and the review steps below cover the rest.

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
- **User-facing behaviour** (screens, dialogs, forms, drag and drop) gets Playwright end-to-end tests in `e2e/specs/`, written against **page objects** in `e2e/pages/` (Page Object Model). Specs never use raw selectors: add a method or locator to the page object instead, and find elements by role and accessible name.
- **Bug fixes** start with a test that fails before the fix. For visual bugs, assert the computed style (`toHaveCSS`), not just the text.
- If something genuinely cannot be tested automatically (pure styling, copy changes), say so in the PR under *How it was tested*, and push with `NO_TESTS_NEEDED=1` so the tests-required check passes.
- Before you claim a test protects something, make it fail at least once (break the code temporarily) to prove it can.

### 3. Small, atomic commits

One logical change per commit, Conventional Commit messages (`feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`). Never mix a refactor with a behaviour change.

## Before every push

All checks run on your machine; a push only pushes.

### 1. Automated checks: `npm run verify`

The **pre-push hook** (`.githooks/pre-push`, enabled by `npm install`; run `npx playwright install chromium` once for the end-to-end step) runs this automatically and stops the push if anything fails. It also refuses any push to `main`.

| Step | Command | What it does |
| --- | --- | --- |
| Type check | `npm run typecheck` | TypeScript across app, service worker and config |
| Lint | `npm run lint` | ESLint over the whole repo |
| Tests required | `npm run check:tests` | Fails when the branch changes `src/` or `supabase/migrations/` without changing any tests |
| Tests | `npm test` | Unit tests and database (RLS) tests in PGlite |
| Dependency audit | `npm run audit:prod` | Fails on high/critical advisories in production dependencies |
| Build | `npm run build` | Production build, including the service worker |
| End-to-end | `npm run test:e2e` | Playwright on desktop and phone viewports against the app in local mode, plus an `auth` project that runs Supabase-mode screens (sign-in) against a fake project; specs under `e2e/specs/auth/` run only there |

Never bypass the hook (`--no-verify`). If a check is wrong, fix the check in its own commit.

### 2. Reviews (AI agents must do this; humans should)

Before pushing, run both reviewers on the branch and address their findings:

- **`security-reviewer`**: tenant isolation, RLS, privilege escalation, auth, injection, data exposure.
- **`code-reviewer`**: bugs, tests, conventions, design and PR description, ending with a merge verdict.

They are Claude Code subagents in `.claude/agents/`, and their full briefs live in [`.github/reviewers/`](.github/reviewers). Fix what they find, or note in the PR description why a finding doesn't apply.

## Project conventions

- **Components render, hooks decide.** Business logic lives in custom hooks (`features/*/hooks`, `src/hooks`) and pure functions in `src/lib/`. Components stay presentational.
- **Styling lives outside JSX.** Each component has a sibling `Component.styles.ts` exporting its Tailwind classes. No inline class strings in `.tsx` files.
- **Combine classes with `cn()`** (`src/lib/cn.ts`, clsx + tailwind-merge), never bare `clsx`, so a conditional class reliably overrides the base one. For components with several states, prefer one complete class set per state (`state: { idle, active, disabled }`) over layering overrides.
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
