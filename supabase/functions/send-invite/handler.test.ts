import { describe, expect, it, vi } from 'vitest'
import { ClaimError, handleSendInvite, type SendInviteDeps } from './handler'

const INVITE_ID = '7d3c1a52-9a1e-4b8e-9c55-2f1f0d6a3b10'

function deps(overrides: Partial<SendInviteDeps> = {}) {
  return {
    claim: vi.fn(async () => ({ email: 'partner@example.com', orgName: 'Test Lenders' })),
    sendEmail: vi.fn(async () => {}),
    ...overrides,
  }
}

const post = (body: unknown, headers: Record<string, string> = { Authorization: 'Bearer user-token' }) =>
  new Request('https://example.supabase.co/functions/v1/send-invite', { method: 'POST', headers, body: JSON.stringify(body) })

describe('send-invite', () => {
  it('claims the invite with the caller’s own token, then emails it', async () => {
    const d = deps()
    const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)

    expect(res.status).toBe(200)
    expect(d.claim).toHaveBeenCalledWith('Bearer user-token', INVITE_ID)
    expect(d.sendEmail).toHaveBeenCalledWith('partner@example.com', 'Test Lenders')
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
      expect(d.sendEmail).not.toHaveBeenCalled()
    }
  })

  it('rejects requests without a signed-in user or a valid invite id', async () => {
    const d = deps()
    expect((await handleSendInvite(post({ inviteId: INVITE_ID }, {}), d)).status).toBe(401)
    expect((await handleSendInvite(post({ inviteId: 'not-a-uuid' }), d)).status).toBe(400)
    expect((await handleSendInvite(post('garbage'), d)).status).toBe(400)
    expect(d.claim).not.toHaveBeenCalled()
  })

  it('reports a failed send without leaking the provider’s error', async () => {
    const d = deps({ sendEmail: vi.fn(async () => Promise.reject(new Error('SMTP 535 auth failed for smtp.internal'))) })
    const res = await handleSendInvite(post({ inviteId: INVITE_ID }), d)
    expect(res.status).toBe(502)
    expect(await res.text()).not.toContain('smtp.internal')
  })

  it('answers the browser’s CORS preflight', async () => {
    const res = await handleSendInvite(new Request('https://x/functions/v1/send-invite', { method: 'OPTIONS' }), deps())
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('authorization')
  })
})
