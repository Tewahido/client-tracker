import { corsHeaders as supabaseCors } from '@supabase/supabase-js/cors'
import { describe, expect, it, vi } from 'vitest'
import { ClaimError, handleSendInvite, type SendInviteDeps } from './handler'

const INVITE_ID = '7d3c1a52-9a1e-4b8e-9c55-2f1f0d6a3b10'

function deps(overrides: Partial<SendInviteDeps> = {}) {
  return {
    claim: vi.fn(async () => ({ email: 'partner@example.com', orgName: 'Test Lenders', inviterEmail: 'owner@example.com' })),
    inviteNewUser: vi.fn(async (): Promise<'sent' | 'exists'> => 'sent'),
    sendSignInLink: vi.fn(async () => {}),
    ...overrides,
  }
}

const post = (body: unknown, headers: Record<string, string> = { Authorization: 'Bearer user-token' }) =>
  new Request('https://example.supabase.co/functions/v1/send-invite', { method: 'POST', headers, body: JSON.stringify(body) })

describe('send-invite', () => {
  it('claims the invite with the caller’s own token, then sends an invite email', async () => {
    const d = deps()
    const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: true, kind: 'invite' })
    expect(d.claim).toHaveBeenCalledWith('Bearer user-token', INVITE_ID)
    expect(d.inviteNewUser).toHaveBeenCalledWith('partner@example.com', { invited_to: 'Test Lenders', invited_by: 'owner@example.com' })
    expect(d.sendSignInLink).not.toHaveBeenCalled()
  })

  it('sends a sign-in link instead when the address already has an account', async () => {
    const d = deps({ inviteNewUser: vi.fn(async (): Promise<'sent' | 'exists'> => 'exists') })
    const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)

    expect(await res.json()).toEqual({ sent: true, kind: 'sign-in-link' })
    expect(d.sendSignInLink).toHaveBeenCalledWith('partner@example.com')
  })

  it('never sends when the database refuses the claim', async () => {
    for (const [code, status] of [
      ['42501', 403],
      ['P0001', 429],
      [undefined, 500],
    ] as const) {
      const d = deps({ claim: vi.fn(async () => Promise.reject(new ClaimError(code, 'refused'))) })
      const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)
      expect(res.status).toBe(status)
      expect(d.inviteNewUser).not.toHaveBeenCalled()
      expect(d.sendSignInLink).not.toHaveBeenCalled()
    }
  })

  it('logs why a send failed, for the project owner, without telling the browser', async () => {
    const log = vi.fn()
    const d = deps({ log, inviteNewUser: vi.fn(async () => Promise.reject(Object.assign(new Error('Error sending invite email'), { status: 500, code: 'unexpected_failure' }))) })
    const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)

    expect(res.status).toBe(502)
    expect(log).toHaveBeenCalledWith('send-invite: sending the email failed', { code: 'unexpected_failure', status: 500, message: 'Error sending invite email' })
    expect(await res.text()).not.toContain('Error sending invite email')
  })

  it('reports a failed send without leaking the provider’s error', async () => {
    const leaky = new Error('SMTP 535 auth failed for smtp.internal')
    for (const d of [
      deps({ inviteNewUser: vi.fn(async () => Promise.reject(leaky)) }),
      deps({ inviteNewUser: vi.fn(async (): Promise<'sent' | 'exists'> => 'exists'), sendSignInLink: vi.fn(async () => Promise.reject(leaky)) }),
    ]) {
      const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)
      expect(res.status).toBe(502)
      expect(await res.text()).not.toContain('smtp.internal')
    }
  })

  it('does not fall back to a sign-in link when the invite email fails for another reason', async () => {
    const d = deps({ inviteNewUser: vi.fn(async () => Promise.reject(new Error('rate limited'))) })
    await handleSendInvite(post({ inviteId: INVITE_ID }), d)
    expect(d.sendSignInLink).not.toHaveBeenCalled()
  })

  it('rejects requests without a signed-in user, a valid invite id or POST', async () => {
    const d = deps()
    expect((await handleSendInvite(post({ inviteId: INVITE_ID }, {}), d)).status).toBe(401)
    expect((await handleSendInvite(post({ inviteId: 'not-a-uuid' }), d)).status).toBe(400)
    expect((await handleSendInvite(post('garbage'), d)).status).toBe(400)
    expect((await handleSendInvite(new Request('https://x/functions/v1/send-invite', { method: 'GET' }), d)).status).toBe(405)
    expect(d.claim).not.toHaveBeenCalled()
  })

  it('allows every header supabase-js may send, or browsers silently drop the call', async () => {
    const res = await handleSendInvite(new Request('https://x/functions/v1/send-invite', { method: 'OPTIONS' }), deps())
    expect(res.status).toBe(204)
    const allowed = res.headers.get('Access-Control-Allow-Headers')!.split(',').map((h) => h.trim())
    const sdkSends = supabaseCors['Access-Control-Allow-Headers'].split(',').map((h) => h.trim())
    expect(allowed).toEqual(expect.arrayContaining(sdkSends))
  })

  it('answers 401 when the database rejects the caller’s token', async () => {
    for (const code of ['PGRST301', 'PGRST302', 'PGRST303']) {
      const d = deps({ claim: vi.fn(async () => Promise.reject(new ClaimError(code, 'JWT invalid'))) })
      expect((await handleSendInvite(post({ inviteId: INVITE_ID }), d)).status).toBe(401)
      expect(d.inviteNewUser).not.toHaveBeenCalled()
    }
  })
})
