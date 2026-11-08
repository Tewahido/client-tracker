# Edge Functions

## `send-invite`

Emails an organisation invite. The app calls it right after an owner creates an invite;
if it isn't deployed or fails, the app falls back to "share the invite yourself".

- **Who may send** is decided by the database: the function first runs
  `claim_invite_email` *as the signed-in owner*. Owners only; each address gets at most 1
  invite email per 10 minutes and 3 a day; each person sends at most 20 a day. See
  `supabase/migrations/20261020000000_invite_emails.sql`.
- **Sending** uses Supabase Auth's own mailer: an "Invite user" email for people new to
  Lendly, or a normal "Magic link" sign-in email for people who already have an account.
- The logic is in `handler.ts` (unit-tested with Vitest); `index.ts` is the Deno wrapper.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by
  Supabase. Nothing secret needs to be set, and the service role key never leaves Supabase.

### Set-up (once, by the project owner)

1. **Apply the migration**: `npx supabase db push` (asks for your database password).
2. **Deploy the function** (after `npx supabase login` and `npx supabase link`):
   ```bash
   npm run deploy:functions
   ```
   This deploys with `--no-verify-jwt`. Projects using Supabase's newer asymmetric (ES256)
   signing keys get every signed-in request rejected by the gateway's JWT check, so the
   function would never run. The token is still verified: the function forwards it to
   `claim_invite_email`, PostgREST validates it, and a missing or invalid token can't pass
   the owner check (the function answers 401).
3. **Site URL**: Dashboard › Authentication › URL Configuration › *Site URL* must be the
   address people open Lendly at. Invite links point there.
4. **Email templates**: Dashboard › Authentication › Email Templates. Paste:
   - *Invite user*: `supabase/templates/invite.html`, subject
     `{{ .Data.invited_by }} invited you to Lendly`
   - *Magic link*: `supabase/templates/magic-link.html`, subject `Your Lendly sign-in link`.
     This is also everyone's normal sign-in email, and what people who already have an
     account receive when invited.
5. **Custom SMTP (needed for real use)**: Supabase's built-in mailer only delivers to
   members of your Supabase team and is heavily rate limited. To email anyone else
   (including sign-in links for your partner), set up SMTP under Dashboard ›
   Authentication › SMTP Settings, e.g. with a free Resend or Brevo account.

## `send-reminders`

Sends payment reminders by Web Push, so they arrive with the app closed (the app's own
30-minute check only runs while it's open; iOS freezes home-screen apps once you leave).

- Once a day the scheduler calls it with `Authorization: Bearer <CRON_SECRET>`. For every
  device in `push_subscriptions` it works out that person's reminders in every organisation
  they belong to, using the app's own rules (`src/lib/reminders.ts`), skips what
  `push_reminder_log` says was already sent, and pushes the rest. Devices the push service
  reports gone (404/410) are deleted.
- "Today" is the date in `Africa/Johannesburg`.
- The logic is in `handler.ts` (unit-tested). `main.ts` is the Deno wrapper; because it
  reuses `src/lib`, `npm run build:functions` bundles it into `index.ts` (not committed),
  and `npm run deploy:functions` builds before deploying.

### Set-up (once, by the project owner)

1. **Apply the migration** (`20261108000000_push_reminders.sql`): `npx supabase db push`.
2. **VAPID keys** (identify Lendly to Apple's and Google's push services). Generate a pair
   once and keep the private key secret; changing it later cuts off every subscribed device
   until it turns reminders on again.
   - The public key goes in the app: `VITE_VAPID_PUBLIC_KEY` in `.env.local` and as a
     GitHub repository variable (the Deploy workflow builds it in).
   - Function secrets:
     ```bash
     npx supabase secrets set VAPID_PUBLIC_KEY=<public> VAPID_PRIVATE_KEY=<private> VAPID_SUBJECT=mailto:<you@example.com> CRON_SECRET=<long random string>
     ```
3. **Deploy**: `npm run deploy:functions`.
4. **Schedule it**: Dashboard › Integrations › Cron › *Create job*: type *Supabase Edge
   Function*, function `send-reminders`, method POST, schedule `0 6 * * *` (06:00 UTC =
   08:00 in South Africa), header `Authorization: Bearer <CRON_SECRET>`.
