/**
 * The send-invite Edge Function's logic, kept free of Deno APIs so Vitest can test it.
 * index.ts wires it to Supabase clients and Deno.serve.
 *
 * Flow: the browser calls this with the owner's own access token and an invite id.
 * `claim` runs the claim_invite_email database function *as that user*, so the database
 * decides whether they may send (owners only, rate limited). Only after a successful
 * claim does `sendEmail` use the service role to send the email through Supabase Auth.
 */

/** Thrown by `claim` with the Postgres error code the database function raised. */
export class ClaimError extends Error {
  readonly code: string | undefined

  constructor(code: string | undefined, message: string) {
    super(message)
    this.code = code
  }
}

export interface SendInviteDeps {
  claim(authorization: string, inviteId: string): Promise<{ email: string; orgName: string }>
  sendEmail(email: string, orgName: string): Promise<void>
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

/** Database error codes from claim_invite_email, mapped to HTTP statuses. */
const CLAIM_STATUS: Record<string, number> = { '42501': 403, P0001: 429 }

export async function handleSendInvite(req: Request, deps: SendInviteDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'POST') return reply(405, { error: 'Use POST' })

  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Sign in first' })

  const body = (await req.json().catch(() => null)) as { inviteId?: unknown } | null
  const inviteId = body?.inviteId
  if (typeof inviteId !== 'string' || !UUID.test(inviteId)) return reply(400, { error: 'inviteId must be a UUID' })

  let invite: { email: string; orgName: string }
  try {
    invite = await deps.claim(authorization, inviteId)
  } catch (err) {
    if (err instanceof ClaimError && err.code && CLAIM_STATUS[err.code]) return reply(CLAIM_STATUS[err.code], { error: err.message })
    return reply(500, { error: 'Could not check the invite' })
  }

  try {
    await deps.sendEmail(invite.email, invite.orgName)
  } catch {
    // Don't echo provider errors back to the browser; they can include internal details.
    return reply(502, { error: 'The email could not be sent' })
  }
  return reply(200, { sent: true })
}
