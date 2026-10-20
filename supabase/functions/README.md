# Edge Functions

## `send-invite`

Emails an organisation invite. The app calls it right after an owner creates an invite;
if it isn't deployed or fails, the app falls back to "share the invite yourself".

- **Who may send** is decided by the database: the function first runs
  `claim_invite_email` *as the signed-in owner* (owners only, once per 10 minutes per
  invite). See `supabase/migrations/20261020000000_invite_emails.sql`.
- **Sending** uses Supabase Auth's own mailer: an "Invite user" email for people new to
  Lendly, or a normal "Magic link" sign-in email for people who already have an account.
- The logic is in `handler.ts` (unit-tested with Vitest); `index.ts` is the Deno wrapper.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by
  Supabase. Nothing secret needs to be set, and the service role key never leaves Supabase.

### Set-up (once, by the project owner)

1. **Apply the migration**: `npx supabase db push` (asks for your database password).
2. **Deploy the function** (after `npx supabase login`):
   ```bash
   npx supabase functions deploy send-invite --project-ref <your-project-ref>
   ```
3. **Site URL**: Dashboard › Authentication › URL Configuration › *Site URL* must be the
   address people open Lendly at. Invite links point there.
4. **Email templates**: Dashboard › Authentication › Email Templates. Paste:
   - *Invite user*: `supabase/templates/invite.html`, subject
     `You're invited to {{ .Data.invited_to }} on Lendly`
   - *Magic link*: `supabase/templates/magic-link.html`, subject `Your Lendly sign-in link`
5. **Custom SMTP (needed for real use)**: Supabase's built-in mailer only delivers to
   members of your Supabase team and is heavily rate limited. To email anyone else
   (including sign-in links for your partner), set up SMTP under Dashboard ›
   Authentication › SMTP Settings, e.g. with a free Resend or Brevo account.
