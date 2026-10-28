/**
 * The send-invite Edge Function's logic, kept free of Deno APIs so Vitest can test it.
 * index.ts wires it to Supabase clients and Deno.serve.
 *
 * Flow: the browser calls this with the owner's own access token and an invite id.
 * `claim` runs the claim_invite_email database function *as that user*, so the database
 * decides whether they may send (owners only, rate limited). Only after a successful
 * claim does the function email the invitee through Supabase Auth: an invite email for
 * someone new to Lendly, or a sign-in link for someone who already has an account. The
 * reply doesn't say which: anyone can create an organisation and invite any address, so
 * it would tell them who uses Lendly. Only the server log records it.
 */

/** Thrown by `claim` with the Postgres error code the database function raised. */
export class ClaimError extends Error {
  readonly code: string | undefined

  constructor(code: string | undefined, message: string) {
    super(message)
    this.code = code
  }
}

export interface ClaimedInvite {
  email: string
  orgName: string
  inviterEmail: string
}

export interface SendInviteDeps {
  claim(authorization: string, inviteId: string): Promise<ClaimedInvite>
  /** Sends Supabase's "Invite user" email; 'exists' when the address already has an account. */
  inviteNewUser(email: string, data: { invited_to: string; invited_by: string }): Promise<'sent' | 'exists'>
  /** Sends Supabase's "Magic link" email to an existing account. */
  sendSignInLink(email: string): Promise<void>
  /** Undoes the claim after a failed send, so it doesn't count against the limits. */
  release(inviteId: string): Promise<void>
  /** Server-side log (Supabase › Edge Functions › Logs). Never sent to the browser. */
  log?(message: string, detail?: unknown): void
}

/** The useful part of an error for the server log: code, status and message, no stack. */
const describe = (err: unknown) =>
  err && typeof err === 'object'
    ? { code: (err as { code?: unknown }).code, status: (err as { status?: unknown }).status, message: (err as { message?: unknown }).message }
    : err

/** What the invitee was sent: an invite email, or (already a user) a sign-in link. Logged only. */
type InviteEmailKind = 'invite' | 'sign-in-link'

// Every header supabase-js may send (its own list is in '@supabase/supabase-js/cors'; a test
// keeps this in step). A header missing here makes the browser drop the request silently.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

/**
 * Error codes from the claim, mapped to HTTP statuses: claim_invite_email's own (not an
 * owner, rate limited) and PostgREST's for a missing, invalid or expired token. The token is
 * verified there rather than at Supabase's gateway, which can't verify this project's
 * asymmetric (ES256) tokens; see supabase/functions/README.md.
 */
const CLAIM_STATUS: Record<string, number> = { '42501': 403, P0001: 429, PGRST301: 401, PGRST302: 401, PGRST303: 401 }

export async function handleSendInvite(req: Request, deps: SendInviteDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return reply(405, { error: 'Use POST' })

  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Sign in first' })

  const body = (await req.json().catch(() => null)) as { inviteId?: unknown } | null
  const inviteId = body?.inviteId
  if (typeof inviteId !== 'string' || !UUID.test(inviteId)) return reply(400, { error: 'inviteId must be a UUID' })

  let invite: ClaimedInvite
  try {
    invite = await deps.claim(authorization, inviteId)
  } catch (err) {
    deps.log?.('send-invite: claim refused or failed', describe(err))
    if (err instanceof ClaimError && err.code && CLAIM_STATUS[err.code]) return reply(CLAIM_STATUS[err.code], { error: err.message })
    return reply(500, { error: 'Could not check the invite' })
  }

  let kind: InviteEmailKind
  try {
    const result = await deps.inviteNewUser(invite.email, { invited_to: invite.orgName, invited_by: invite.inviterEmail })
    if (result === 'exists') await deps.sendSignInLink(invite.email)
    kind = result === 'exists' ? 'sign-in-link' : 'invite'
  } catch (err) {
    // Log the provider's error for the project owner, but don't echo it back to the browser.
    deps.log?.('send-invite: sending the email failed', describe(err))
    await deps.release(inviteId).catch((releaseErr) => deps.log?.('send-invite: releasing the claim failed', describe(releaseErr)))
    return reply(502, { error: 'The email could not be sent' })
  }
  deps.log?.('send-invite: emailed', { kind })
  return reply(200, { sent: true })
}
