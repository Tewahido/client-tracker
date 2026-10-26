import { expect, test as base } from '@playwright/test'
import { OrganizationSettings } from '../../pages/OrganizationSettings'
import { FakeSupabase } from '../../support/fakeSupabase'

// Signed in as an organisation owner against an in-memory fake of the Supabase API.
const test = base.extend<{ backend: FakeSupabase; org: OrganizationSettings }>({
  backend: async ({ page }, provide) => {
    const backend = new FakeSupabase(page)
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

test('refuses an organisation name with a web address, since names go into invite emails', async ({ org }) => {
  await org.orgName.fill('Pay at lendly-support.com today')
  await org.saveOrgName.click()
  await expect(org.orgName).toHaveAccessibleDescription("Names can't include web addresses or < >")

  // Typing again clears the message.
  await org.orgName.fill('Dlamini Family Fund')
  await expect(org.orgName).not.toHaveAccessibleDescription(/web addresses/)
})
