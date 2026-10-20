import { expect, test as base } from '@playwright/test'
import { OrganizationSettings } from '../../pages/OrganizationSettings'
import { FakeSupabase, ORG } from '../../support/fakeSupabase'

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

test('role descriptions stay out of the way until asked for', async ({ org }) => {
  await expect(org.inviteButton).toBeVisible()
  await expect(org.roleGuide).toBeHidden()

  await org.roleInfoButton.click()
  await expect(org.roleGuide).toContainText('Owner')
  await expect(org.roleGuide).toContainText('Member')
  await expect(org.roleGuide).toContainText('Viewer')
  // The info button sits near the right edge on desktop: the guide must not be cut off.
  expect(await org.roleGuideFitsWindow()).toBe(true)

  await org.page.keyboard.press('Escape')
  await expect(org.roleGuide).toBeHidden()
})

test('after inviting someone, explains what they need to do next', async ({ org, backend }) => {
  // The old always-visible instructions are gone from the form.
  await expect(org.text(/Send them the app link/)).toBeHidden()

  await org.invite('Partner@Example.com', 'Viewer')

  await expect(org.inviteReady.root).toBeVisible()
  await expect(org.inviteReady.root).toContainText(`partner@example.com can join ${ORG.name} as a Viewer`)
  await expect(org.inviteReady.copyLinkButton).toBeVisible()
  expect(backend.invites.map((i) => [i.email, i.role])).toEqual([['partner@example.com', 'viewer']])

  await org.inviteReady.doneButton.click()
  await expect(org.inviteReady.root).toBeHidden()
  await expect(org.pendingInvite('partner@example.com')).toBeVisible()
  await expect(org.inviteEmail).toHaveValue('')
})

test('a failed invite shows the error and no next steps', async ({ org, backend }) => {
  backend.failNextInviteWith = '23505'
  await org.invite('partner@example.com')

  await expect(org.toast('That email has already been invited')).toBeVisible()
  await expect(org.inviteReady.root).toBeHidden()
  await expect(org.inviteEmail).toHaveValue('partner@example.com')
})
