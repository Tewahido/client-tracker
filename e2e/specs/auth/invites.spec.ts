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
    // Depending on `backend` makes sure its routes are installed before the page loads.
    void backend
    const org = new OrganizationSettings(page)
    await org.captureInviteMessages()
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

  // Closes with Escape, a second tap on the button, or a tap anywhere else.
  await org.page.keyboard.press('Escape')
  await expect(org.roleGuide).toBeHidden()
  await org.roleInfoButton.click()
  await org.roleInfoButton.click()
  await expect(org.roleGuide).toBeHidden()
  await org.roleInfoButton.click()
  await org.inviteEmail.click()
  await expect(org.roleGuide).toBeHidden()
})

test('emails the invite and says so', async ({ org, backend }) => {
  await org.invite('Partner@Example.com', 'Viewer')

  await expect(org.inviteSent.root).toBeVisible()
  await expect(org.inviteSent.root).toContainText(`We emailed partner@example.com about joining ${ORG.name} as a Viewer`)
  await expect(org.inviteSent.root).toContainText('follow its link to sign in')
  // The function was asked to email exactly the invite that was just created.
  expect(backend.emailed).toEqual(backend.invites.map((i) => i.id))
  expect(backend.emailed).toHaveLength(1)

  // Sharing by hand is still there as a backup.
  await org.inviteSent.sendButton.click()
  await expect.poll(() => org.lastInviteMessage()).toContain('with partner@example.com')
  await org.inviteSent.doneButton.click()
  await expect(org.pendingInvite('partner@example.com')).toBeVisible()
})

// Anyone can create an organisation, so the dialog must not reveal who already has an
// account, even if an older send-invite function still says which email it sent.
test('says the same whether or not the person already uses Lendly', async ({ org, backend }) => {
  await org.invite('new@example.com')
  const forNewcomer = await org.inviteSent.text()
  await org.inviteSent.doneButton.click()

  backend.emailResult = 'sign-in-link'
  await org.invite('existing@example.com')
  const forExistingUser = await org.inviteSent.text()

  expect(forExistingUser.replace('existing@example.com', 'new@example.com')).toBe(forNewcomer)
  expect(forExistingUser).not.toContain('already uses Lendly')
})

test('says why when the invite was not emailed because of the limits', async ({ org, backend }) => {
  backend.emailResult = 'rate-limited'
  await org.invite('partner@example.com')

  await expect(org.inviteReady.root).toContainText('sent lots of invites recently')
  await expect(org.inviteReady.sendButton).toBeVisible()
})

test('when the email cannot be sent, explains how to share the invite instead', async ({ org, backend }) => {
  backend.emailResult = 'failed'
  // The old always-visible instructions are gone from the form.
  await expect(org.text(/Send them the app link/)).toBeHidden()

  await org.invite('Partner@Example.com', 'Owner')

  await expect(org.inviteReady.root).toBeVisible()
  await expect(org.inviteReady.root).toContainText(`partner@example.com can join ${ORG.name} as an Owner`)
  expect(backend.invites.map((i) => [i.email, i.role])).toEqual([['partner@example.com', 'owner']])

  await org.inviteReady.doneButton.click()
  await expect(org.inviteReady.root).toBeHidden()
  await expect(org.pendingInvite('partner@example.com')).toBeVisible()
  await expect(org.inviteEmail).toHaveValue('')
})

test('the invite message says who invited them and which email to use', async ({ org, backend }) => {
  backend.emailResult = 'failed'
  await org.invite('partner@example.com')
  await org.inviteReady.sendButton.click()
  await expect.poll(() => org.lastInviteMessage()).toContain(`added you to ${ORG.name} on Lendly`)
  expect(await org.lastInviteMessage()).toContain(`with partner@example.com`)
  await org.inviteReady.doneButton.click()

  // Pending invites can send it again later.
  await org.invite('second@example.com')
  await org.inviteReady.doneButton.click()
  await org.shareInviteFor('partner@example.com').click()
  await expect.poll(() => org.lastInviteMessage()).toContain('with partner@example.com')
})

test('a failed invite shows the error and no next steps', async ({ org, backend }) => {
  backend.failNextInviteWith = '23505'
  await org.invite('partner@example.com')

  await expect(org.toast('That email has already been invited')).toBeVisible()
  await expect(org.inviteReady.root).toBeHidden()
  await expect(org.inviteSent.root).toBeHidden()
  // No invite was created, so there was nothing to email.
  expect(backend.emailed).toEqual([])
  await expect(org.inviteEmail).toHaveValue('partner@example.com')
})

test.describe('on a very narrow phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('the role guide, the invite dialog and a long pending invite all fit the screen', async ({ org }) => {
    await org.roleInfoButton.click()
    expect(await org.roleGuideFitsWindow()).toBe(true)
    await org.page.keyboard.press('Escape')

    await org.invite('a.really.long.email.address@example.com')
    await expect(org.inviteSent.root).toBeVisible()
    expect(await org.overflowsHorizontally()).toBe(false)
    await org.inviteSent.doneButton.click()
    await expect(org.pendingInvite('a.really.long.email.address@example.com')).toBeVisible()
    expect(await org.overflowsHorizontally()).toBe(false)
  })
})
