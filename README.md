# Lendly

Keep track of money you've lent: who owes what, when it's due, and what's been paid back. Lendly reminds you before and after due dates and lets a whole household or team share one ledger.

## Features

- **Dashboard**: total outstanding, overdue and due-this-week totals, collections per month, what needs attention next.
- **Loans**: amount, optional flat interest, lent and due dates, notes. Record partial payments, mark as fully paid, give more time, or forgive a loan.
- **Monthly plans**: spread a loan over months. Months, the monthly payment and the total fill each other in (R2,000 × 12 = R24,000). Every instalment has its own due date and shows as paid, paid late or missed.
- **People**: everyone you've lent to, what they owe, their next due date, an on-time repayment rating and any missed instalments.
- **Reminders**:
  - browser notifications when a loan is due soon, due today, or 1, 3 and 7 days overdue (then weekly);
  - a bell with everything that needs attention;
  - due dates exported to your calendar with alarms, which fire even when the app is closed.
- **Organisations**: create an organisation, invite people by email and share the same ledger. Roles are Owner, Member and Viewer.
- **Lending defaults**: owners set the currency, default lending period and default interest rate for new loans.
- **Data**: CSV export for spreadsheets, plus JSON backup and restore.
- **Installable**: works as an app on phones and desktops, with offline support and light/dark themes.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19 + TypeScript, built with Vite |
| Styling | Tailwind CSS v4 (classes live in `*.styles.ts` files, not in JSX) |
| Animation and charts | Motion, Recharts |
| Data and auth | Supabase (Postgres + Row Level Security, magic-link auth, Realtime) |
| Offline / install | vite-plugin-pwa with a custom Workbox service worker |
| Tests | Vitest for logic, PGlite (Postgres in WebAssembly) for database policy tests, Playwright with page objects for end-to-end tests |

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173. To try it with realistic data, restore [`samples/lendly-sample-backup.json`](samples) from **Settings → Your data**. Without Supabase settings the app runs in **local mode**: everything is stored in this browser only. That's handy for trying it out, but there are no accounts and no sharing.

## Connecting Supabase (accounts and sharing)

1. **Create a project** at [supabase.com](https://supabase.com).
2. **Create the database.** Run the files in [`supabase/migrations`](supabase/migrations) in filename order, either in the dashboard's SQL editor or with the Supabase CLI:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. **Configure Auth** (Authentication → URL Configuration):
   - **Site URL**: where the app is hosted (e.g. `https://lendly.example.com`, or `http://localhost:5173` while developing).
   - **Redirect URLs**: add the same URL(s).
   - *Optional:* add `{{ .Token }}` to the Magic Link email template. People can then type a 6-digit code instead of clicking the link, which is handy inside an installed app.
4. **Add your keys.** Copy `.env.example` to `.env.local` and fill in the project URL and publishable key (Project Settings → API):

   ```bash
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

5. Restart `npm run dev`. Sign in with your email, create an organisation, then invite your partner from **Settings → Organisation**. They sign in with the invited email and accept the invite.

The publishable key is safe to ship to browsers. Access is enforced by Row Level Security in the database, not by the app.

## Roles

| | Owner | Member | Viewer |
| --- | :---: | :---: | :---: |
| See people, loans and payments | ✓ | ✓ | ✓ |
| Add and edit people and loans, record payments | ✓ | ✓ | |
| Remove a payment they recorded | ✓ | ✓ | |
| Delete people, loans or any payment; forgive loans | ✓ | | |
| Restore a backup | ✓ | | |
| Rename the organisation, set lending defaults | ✓ | | |
| Invite, remove and change roles of members | ✓ | | |
| Delete the organisation | ✓ | | |

Anyone can leave an organisation. The last owner has to make someone else an owner first. When the last member leaves, the organisation is deleted.

## About notifications

- Notifications are **per device**. Each person turns them on in **Settings → Reminders** on each phone or computer they use.
- They are checked when the app opens, when it comes back into focus, and every 30 minutes while it's running. Each reminder stage fires once per device.
- On iPhone and iPad, web notifications only work once the app is **added to the Home Screen** (iOS 16.4+).
- For reminders that arrive even when the app is closed, use **Add to calendar** on a loan, or **Settings → Reminders → Export due dates**.

## Project structure

```
src/
  app/          App shell, routing, dialogs (overlays), sign-in/organisation gate
  components/   Reusable UI kit (ui/) and layout pieces (layout/)
  features/     One folder per feature: dashboard, loans, people, reminders,
                organizations, settings, auth; each with components/ and hooks/
  hooks/        Shared hooks (permissions, money formatting, theme, routing…)
  lib/          Pure, framework-free logic with unit tests (balances, statuses,
                reminders, calendar files, CSV, backups)
  providers/    React context: settings, workspace (auth + organisations), loan store
  services/     Side effects: Supabase, storage repositories, notifications, downloads
  sw.ts         Service worker
supabase/
  migrations/   Database schema, policies and functions
  tests/        Row Level Security tests run against the real migrations in PGlite
```

Conventions:

- **Components render. Hooks decide.** Business logic lives in hooks (`features/*/hooks`) and in pure functions in `lib/`.
- **Styling stays out of JSX.** Each component has a sibling `Component.styles.ts` exporting its Tailwind classes.
- **One way to the data.** Screens use the loan store, which talks to a `DataRepository`: browser storage or Supabase, swapped without touching the UI.
- **Money is stored as integer cents**, so totals never drift.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Unit tests and database policy tests |
| `npm run test:e2e` | Playwright end-to-end tests (desktop and phone); run `npx playwright install chromium` once first |
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run verify` | Every check (typecheck, lint, tests-required, tests, audit, build, end-to-end); runs automatically before each `git push` |
| `npm run icons` | Regenerate app icons from `public/favicon.svg` |

## Deploying

The build is a static site: deploy `dist/` to Vercel, Netlify, Cloudflare Pages, your own server, or similar. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's environment settings (they are built into the files, so a wrong URL blocks every request), and add the deployed URL to Supabase's Site URL and Redirect URLs. It must be served over HTTPS for notifications and installation to work.

- **Apply database migrations first** (`npx supabase db push`) whenever a release includes new ones.
- **Content-Security-Policy:** every build carries one as a `<meta>` tag, allowing only the app's own scripts and connections to your Supabase project.
- **Clickjacking:** a `<meta>` policy can't stop other sites framing the app, so the host must send `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- **Own server:** [`deploy/Caddyfile`](deploy/Caddyfile) serves `dist/` with HTTPS, those headers and the right caching (the service worker must never be cached).

### Deploying to your own server

`npm run deploy` checks that you're on an up-to-date `main` with no local changes, runs every check (`npm run verify`), uploads `dist/`, and confirms the server serves exactly what was built. `npm run deploy -- --rollback` swaps the live and previous versions (so running it twice returns to the newer one). The **Deploy** GitHub Actions workflow does the same, but only when someone starts it: **Actions → Deploy → Run workflow**, or `gh workflow run deploy.yml`. Nothing deploys on merge.

Uploads go to [`deploy/lendly-receive.sh`](deploy/lendly-receive.sh) on the server, which unpacks the build beside the live one, swaps it in, and keeps the previous version as `lendly.old`.

**Once, on the server** (as root): a `deploy` user that owns `/var/www` (the receiver creates and renames folders there) and has your SSH key, plus the receiver itself:

```bash
adduser --disabled-password --gecos "" deploy
install -d -o deploy -g deploy -m 700 /home/deploy/.ssh && install -o deploy -g deploy -m 600 ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown deploy:deploy /var/www && mkdir -p /var/www/lendly && chown deploy:deploy /var/www/lendly
install -o root -g root -m 755 lendly-receive.sh /usr/local/bin/lendly-receive
```

The `deploy` user needs no sudo.

**For `npm run deploy`:** add to `.env.local`:

```bash
DEPLOY_HOST=deploy@<server-ip>
DEPLOY_URL=https://<your-domain>
```

It uses your normal SSH key. Under Git Bash, `ssh` doesn't use the Windows ssh-agent, so a key with a passphrase must be loaded in Git Bash's own agent (`eval $(ssh-agent) && ssh-add`), or run the deploy from PowerShell.

**For the workflow:**

1. Make a key that can only deploy, and allow it on the server. On your PC:
   ```bash
   ssh-keygen -t ed25519 -N "" -C github-actions-deploy -f lendly-ci-key
   ```
   Then, on the server, add a line to `/home/deploy/.ssh/authorized_keys`. `restrict` turns off shells, forwarding and everything else, and `command` makes the key run the receiver whatever it asks for:
   ```
   restrict,command="/usr/local/bin/lendly-receive" <contents of lendly-ci-key.pub>
   ```
2. In GitHub, create a **production** environment (Settings → Environments) and set it up so only `main` can use it. GitHub runs the workflow file from whichever branch someone picks, so without this, a pushed branch with an edited workflow could read the secrets:
   - **Deployment branches and tags:** Selected branches, `main` only.
   - **Required reviewers:** yourself, so every deploy waits for your approval.
   - **Secrets:** `DEPLOY_SSH_KEY` (the private key file), `DEPLOY_HOST` (`deploy@<server-ip>`), and `DEPLOY_KNOWN_HOSTS`. The last is the output of `ssh-keyscan -t ed25519 <server-ip>`, checked against the fingerprint you accepted when you first connected.
   - **Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `DEPLOY_URL`.
3. Delete the private key from your PC once it's in GitHub.

The workflow keeps secrets away from npm packages: a **build** job with no secrets installs, checks and builds; a **deploy** job with the secrets runs no packages and only uploads. The receiver accepts only plain files and folders, caps the upload size and time, and runs one deploy at a time.
Database migrations stay a deliberate, manual step: apply them before deploying a release that needs them. The workflow has no database credentials, on purpose.
