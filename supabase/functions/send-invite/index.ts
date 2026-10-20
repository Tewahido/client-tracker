// Supabase Edge Function (Deno): emails an organisation invite.
// Deploy: npx supabase functions deploy send-invite (see supabase/functions/README.md).
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase
// automatically; nothing has to be configured by hand.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { ClaimError, handleSendInvite } from './handler.ts'

const url = Deno.env.get('SUPABASE_URL')!
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const noSession = { auth: { persistSession: false, autoRefreshToken: false } }
// The service role is used only to send mail, never to read or write app data.
const admin = createClient(url, serviceKey, noSession)
const mailer = createClient(url, anonKey, noSession)

Deno.serve((req) =>
  handleSendInvite(req, {
    async claim(authorization, inviteId) {
      // Runs as the caller: the database checks they own the invite's organisation.
      const asCaller = createClient(url, anonKey, { ...noSession, global: { headers: { Authorization: authorization } } })
      const { data, error } = await asCaller.rpc('claim_invite_email', { p_invite: inviteId }).single<{ invite_email: string; org_name: string }>()
      if (error) throw new ClaimError(error.code, error.message)
      return { email: data.invite_email, orgName: data.org_name }
    },

    async sendEmail(email, orgName) {
      // New to Lendly: Supabase's "Invite user" email (its template can use {{ .Data.invited_to }}).
      const { error } = await admin.auth.admin.inviteUserByEmail(email, { data: { invited_to: orgName } })
      if (!error) return
      // Already has an account: send a normal sign-in link; the invite is waiting in the app.
      if (error.code === 'email_exists' || /already been registered/i.test(error.message)) {
        const { error: linkError } = await mailer.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        if (linkError) throw linkError
        return
      }
      throw error
    },
  }),
)
