// Supabase Edge Function (Deno): emails an organisation invite. The logic is in handler.ts.
// Deploy: npx supabase functions deploy send-invite (see supabase/functions/README.md).
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase
// automatically; nothing has to be configured by hand.
// Pinned to the version the app is tested with (keep in step with package.json).
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { ClaimError, handleSendInvite } from './handler.ts'

const env = (name: string) => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const url = env('SUPABASE_URL')
const anonKey = env('SUPABASE_ANON_KEY')
const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')

const noSession = { auth: { persistSession: false, autoRefreshToken: false } }
// The service role is used only to send mail, never to read or write app data.
const admin = createClient(url, serviceKey, noSession)
const mailer = createClient(url, anonKey, noSession)

Deno.serve((req) =>
  handleSendInvite(req, {
    async claim(authorization, inviteId) {
      // Runs as the caller: the database checks they own the invite's organisation.
      const asCaller = createClient(url, anonKey, { ...noSession, global: { headers: { Authorization: authorization } } })
      const { data, error } = await asCaller
        .rpc('claim_invite_email', { p_invite: inviteId })
        .single<{ invite_email: string; org_name: string; inviter_email: string }>()
      if (error) throw new ClaimError(error.code, error.message)
      return { email: data.invite_email, orgName: data.org_name, inviterEmail: data.inviter_email }
    },

    async inviteNewUser(email, data) {
      const { error } = await admin.auth.admin.inviteUserByEmail(email, { data })
      if (!error) return 'sent'
      if (error.code === 'email_exists') return 'exists'
      throw error
    },

    async sendSignInLink(email) {
      const { error } = await mailer.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
      if (error) throw error
    },

    async release(inviteId) {
      // Service role only: owners can't release claims themselves (see the migration).
      const { error } = await admin.rpc('release_invite_email', { p_invite: inviteId })
      if (error) throw error
    },

    log: (message, detail) => console.error(message, JSON.stringify(detail)),
  }),
)
