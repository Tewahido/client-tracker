import { expect, test as base } from '@playwright/test'
import { OrganizationSettings } from '../../pages/OrganizationSettings'
import { FakeSupabase } from '../../support/fakeSupabase'

// Signed in as an organisation owner, with one other member, against a fake Supabase API.
const test = base.extend<{ backend: FakeSupabase; org: OrganizationSettings }>({
  backend: async ({ page }, provide) => {
    const backend = new FakeSupabase(page)
    backend.otherMembers.push({ user_id: 'user-2', email: 'partner@example.com', role: 'member', joined_at: '2026-02-01T00:00:00Z' })
    await backend.signInAsOwner()
    await provide(backend)
  },
  org: async ({ page, backend }, provide) => {
    void backend
    const org = new OrganizationSettings(page)
    await org.open()
    await provide(org)
  },
})

test('the role picker uses our compact chevron with room around it', async ({ org }) => {
  const picker = org.roleFor('partner@example.com')
  await expect(picker).toHaveCSS('appearance', 'none')
  await expect(picker).toHaveCSS('padding-right', '28px')
})
