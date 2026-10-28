import type { Page, Route } from '@playwright/test'

/**
 * A tiny stand-in for the Supabase project the "auth" projects point at
 * (https://lendly-e2e.supabase.co), so screens that need a signed-in user can be tested
 * without a network. It answers just the queries the app makes, from in-memory data.
 * Access rules are not modelled here: those are covered by the database tests.
 */

export const ORG = { id: 'org-1', name: 'Test Lenders' }
export const ME = { id: 'user-1', email: 'owner@example.com' }

interface InviteRow {
  id: string
  org_id: string
  email: string
  role: string
  created_at: string
}

const STORAGE_KEY = 'sb-lendly-e2e-auth-token'

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

function fakeSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const user = {
    id: ME.id,
    email: ME.email,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  }
  return {
    // The app never verifies this token; it only has to look like a JWT.
    access_token: `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub: ME.id, email: ME.email, exp: expiresAt, role: 'authenticated' })}.sig`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: 'fake-refresh-token',
    user,
  }
}

export class FakeSupabase {
  readonly invites: InviteRow[] = []
  /** When set, the next invite insert fails with this Postgres error code. */
  failNextInviteWith: string | null = null
  /**
   * How the send-invite Edge Function answers: which email it sent (as older versions of it
   * said; the current one doesn't), or why it didn't send one.
   */
  emailResult: 'invite' | 'sign-in-link' | 'rate-limited' | 'failed' = 'invite'
  /** Invite ids the send-invite function was asked to email. */
  readonly emailed: string[] = []
  /** Members besides me (the owner); add some before the page loads. */
  readonly otherMembers: { user_id: string; email: string; role: string; joined_at: string }[] = []
  /** Organisations I belong to and my role in each; I own ORG unless changed. */
  readonly memberships: { org: { id: string; name: string }; role: string }[] = [{ org: ORG, role: 'owner' }]
  /** Invites addressed to me, from other organisations. */
  readonly myInvites: (InviteRow & { org_name: string })[] = []
  /** People in each organisation's ledger, by organisation id. */
  readonly people: Record<string, string[]> = {}

  constructor(private readonly page: Page) {}

  /** Start the next page load signed in as the owner of ORG. */
  async signInAsOwner() {
    const session = fakeSession()
    await this.page.addInitScript(([key, value]) => localStorage.setItem(key, value), [STORAGE_KEY, JSON.stringify(session)] as const)
    await this.page.route('**/auth/v1/**', (route) =>
      route.request().url().includes('/user')
        ? route.fulfill({ json: session.user })
        : route.fulfill({ status: 204, body: '' }),
    )
    await this.page.route('**/rest/v1/**', (route) => this.rest(route))
    await this.page.route('**/functions/v1/send-invite', (route) => {
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204 })
      this.emailed.push((route.request().postDataJSON() as { inviteId: string }).inviteId)
      switch (this.emailResult) {
        case 'rate-limited':
          return route.fulfill({ status: 429, json: { error: 'This address was sent an invite recently' } })
        case 'failed':
          return route.fulfill({ status: 502, json: { error: 'The email could not be sent' } })
        default:
          return route.fulfill({ json: { sent: true, kind: this.emailResult } })
      }
    })
  }

  private async rest(route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop()
    const method = request.method()

    if (table === 'organization_members' && method === 'GET') {
      if (url.searchParams.get('select')?.includes('organizations')) {
        return route.fulfill({
          json: this.memberships.map(({ org, role }) => ({
            role,
            organizations: { ...org, currency: 'ZAR', default_term_days: 30, default_interest_rate: '0' },
          })),
        })
      }
      return route.fulfill({ json: [{ user_id: ME.id, email: ME.email, role: 'owner', joined_at: '2026-01-01T00:00:00Z' }, ...this.otherMembers] })
    }

    if (table === 'organization_invites') {
      if (method === 'GET') {
        // Invites addressed to me vs. the organisation's outgoing invites.
        if (url.searchParams.has('email')) {
          return route.fulfill({ json: this.myInvites.map(({ org_name, ...row }) => ({ ...row, organizations: { name: org_name } })) })
        }
        return route.fulfill({ json: this.invites })
      }
      if (method === 'POST') {
        if (this.failNextInviteWith) {
          const code = this.failNextInviteWith
          this.failNextInviteWith = null
          return route.fulfill({ status: 409, json: { code, message: 'duplicate key value', details: null, hint: null } })
        }
        const body = request.postDataJSON() as Omit<InviteRow, 'id' | 'created_at'>
        const row = { ...body, id: crypto.randomUUID(), created_at: new Date().toISOString() }
        this.invites.push(row)
        // The app asks for the new row back (insert … select('id').single()).
        return route.fulfill({ status: 201, json: { id: row.id } })
      }
      if (method === 'DELETE') {
        const id = url.searchParams.get('id')?.replace(/^eq\./, '')
        for (const list of [this.invites, this.myInvites]) {
          const index = list.findIndex((i) => i.id === id)
          if (index >= 0) list.splice(index, 1)
        }
        return route.fulfill({ status: 204, body: '' })
      }
    }

    if (table === 'accept_invite' && method === 'POST') {
      const { p_invite } = request.postDataJSON() as { p_invite: string }
      const index = this.myInvites.findIndex((i) => i.id === p_invite)
      if (index < 0) throw new Error(`No invite ${p_invite} for me in the fake`)
      const [invite] = this.myInvites.splice(index, 1)
      this.memberships.push({ org: { id: invite.org_id, name: invite.org_name }, role: invite.role })
      return route.fulfill({ json: invite.org_id })
    }

    if (table === 'borrowers' && method === 'GET') {
      const orgId = url.searchParams.get('org_id')?.replace(/^eq\./, '') ?? ''
      const names = this.people[orgId] ?? []
      return route.fulfill({
        json: names.map((name, i) => ({ id: `${orgId}-person-${i}`, name, phone: null, email: null, notes: null, created_at: '2026-01-01T00:00:00Z' })),
      })
    }

    // Borrowers, loans, payments and anything else: an empty organisation.
    return route.fulfill({ json: [] })
  }
}
