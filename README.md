# Lendly

Keep track of money you've lent: who owes what, when it's due, and what's been paid back. Lendly reminds you before and after due dates and lets a whole household or team share one ledger.

## Features

- **Dashboard**: total outstanding, overdue and due-this-week totals, collections per month, what needs attention next.
- **Loans**: amount, optional flat interest, lent and due dates, notes. Record partial payments, mark as fully paid, give more time, or forgive a loan.
- **People**: everyone you've lent to, what they owe, their next due date and an on-time repayment rating.
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
| Tests | Vitest, plus PGlite (Postgres in WebAssembly) for database policy tests |

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173. Without Supabase settings the app runs in **local mode**: everything is stored in this browser only. That's handy for trying it out, but there are no accounts and no sharing.

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
| `npm run typecheck` / `npm run lint` | Static checks |
| `npm run verify` | Every check (typecheck, lint, tests-required, tests, audit, build); runs automatically before each `git push` |
| `npm run icons` | Regenerate app icons from `public/favicon.svg` |

## Deploying

The build is a static site: deploy `dist/` to Vercel, Netlify, Cloudflare Pages or similar. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host's environment settings, and add the deployed URL to Supabase's Site URL and Redirect URLs. It must be served over HTTPS for notifications and installation to work.
