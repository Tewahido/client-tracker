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
  }

  private async rest(route: Route) {
    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/').pop()
    const method = request.method()

    if (table === 'organization_members' && method === 'GET') {
      if (url.searchParams.get('select')?.includes('organizations')) {
        return route.fulfill({
          json: [{ role: 'owner', organizations: { ...ORG, currency: 'ZAR', default_term_days: 30, default_interest_rate: '0' } }],
        })
      }
      return route.fulfill({ json: [{ user_id: ME.id, email: ME.email, role: 'owner', joined_at: '2026-01-01T00:00:00Z' }] })
    }

    if (table === 'organization_invites') {
      if (method === 'GET') {
        // Invites addressed to me (none) vs. the organisation's outgoing invites.
        return route.fulfill({ json: url.searchParams.has('email') ? [] : this.invites })
      }
      if (method === 'POST') {
        if (this.failNextInviteWith) {
          const code = this.failNextInviteWith
          this.failNextInviteWith = null
          return route.fulfill({ status: 409, json: { code, message: 'duplicate key value', details: null, hint: null } })
        }
        const body = request.postDataJSON() as Omit<InviteRow, 'id' | 'created_at'>
        this.invites.push({ ...body, id: `invite-${this.invites.length + 1}`, created_at: new Date().toISOString() })
        return route.fulfill({ status: 201, body: '' })
      }
      if (method === 'DELETE') {
        const id = url.searchParams.get('id')?.replace(/^eq\./, '')
        this.invites.splice(
          this.invites.findIndex((i) => i.id === id),
          1,
        )
        return route.fulfill({ status: 204, body: '' })
      }
    }

    // Borrowers, loans, payments and anything else: an empty organisation.
    return route.fulfill({ json: [] })
  }
}
