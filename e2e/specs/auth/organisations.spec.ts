import { expect, test as base } from '@playwright/test'
import { OrganisationsPage } from '../../pages/OrganisationsPage'
import { FakeSupabase, ME } from '../../support/fakeSupabase'

const MINE = { id: 'org-mine', name: 'Abebe Loans' }
const SHARED = { id: 'org-shared', name: 'Shared Ledger' }

// Signed in against a fake Supabase API; each test sets up which organisations I'm in.
const test = base.extend<{ backend: FakeSupabase; orgs: OrganisationsPage }>({
  backend: async ({ page }, provide) => {
    const backend = new FakeSupabase(page)
    backend.memberships.splice(0, backend.memberships.length, { org: MINE, role: 'owner' })
    backend.people[MINE.id] = ['Someone of mine']
    backend.people[SHARED.id] = ['Sipho Dlamini']
    await backend.signInAsOwner()
    await provide(backend)
  },
  orgs: async ({ page, backend }, provide) => {
    void backend
    await provide(new OrganisationsPage(page))
  },
})

test('someone in two organisations can find and open the shared one', async ({ orgs, backend }) => {
  backend.memberships.push({ org: SHARED, role: 'member' })
  await orgs.goto('people')
  await expect(orgs.personNamed('Someone of mine')).toBeVisible()
  // The current organisation is on screen on phones as well as desktop.
  await expect(orgs.currentOrgButton()).toContainText(MINE.name)

  await orgs.openFromNav()
  await expect(orgs.heading('Organisations')).toBeVisible()
  await expect(orgs.org(MINE.name)).toContainText('Owner')
  await expect(orgs.org(SHARED.name)).toContainText('Member')

  await orgs.openButton(SHARED.name).click()
  await expect(orgs.currentOrgButton()).toContainText(SHARED.name)
  await orgs.goto('people')
  await expect(orgs.personNamed('Sipho Dlamini')).toBeVisible()

  // Remembered next time the app opens on this device.
  await orgs.reload()
  await expect(orgs.personNamed('Sipho Dlamini')).toBeVisible()
  await expect(orgs.currentOrgButton()).toContainText(SHARED.name)
})

test('the current organisation opens a menu to switch, and a second tap closes it', async ({ orgs, backend }) => {
  backend.memberships.push({ org: SHARED, role: 'member' })
  await orgs.goto('people')

  await orgs.currentOrgButton().click()
  await expect(orgs.menuItem(MINE.name)).toBeVisible()
  await expect(orgs.menuItem(SHARED.name)).toBeVisible()
  await expect(orgs.currentOrgButton()).toHaveAttribute('aria-expanded', 'true')
  await orgs.currentOrgButton().click()
  await expect(orgs.menu).toBeHidden()
  await expect(orgs.currentOrgButton()).toHaveAttribute('aria-expanded', 'false')

  await orgs.currentOrgButton().click()
  await orgs.menuItem(SHARED.name).click()
  await expect(orgs.menu).toBeHidden()
  await expect(orgs.currentOrgButton()).toContainText(SHARED.name)
  await expect(orgs.personNamed('Sipho Dlamini')).toBeVisible()
})

test.describe('on a very narrow phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('the organisation menu fits the screen and closes with Escape', async ({ orgs, backend }) => {
    backend.memberships.push({ org: SHARED, role: 'member' })
    await orgs.goto('home')
    await orgs.currentOrgButton().click()
    await expect(orgs.menuItem(SHARED.name)).toBeVisible()
    expect(await orgs.menuFitsWindow()).toBe(true)

    await orgs.page.keyboard.press('Escape')
    await expect(orgs.menu).toBeHidden()
  })
})

test('an invite that arrives after you made your own organisation is shown and can be joined', async ({ orgs, backend }) => {
  backend.myInvites.push({ id: 'invite-1', org_id: SHARED.id, org_name: SHARED.name, email: ME.email, role: 'member', created_at: '2026-10-01T00:00:00Z' })
  await orgs.goto('home')

  await expect(orgs.inviteBanner).toContainText(`You're invited to join ${SHARED.name}`)
  await orgs.seeInvitesButton.click()
  await expect(orgs.heading('Organisations')).toBeVisible()

  await orgs.joinButton(SHARED.name).click()
  // Straight into the shared ledger.
  await expect(orgs.toast(`You're in ${SHARED.name}`)).toBeVisible()
  await expect(orgs.page).toHaveURL(/#home$/)
  await expect(orgs.currentOrgButton()).toContainText(SHARED.name)
  await expect(orgs.inviteBanner).toBeHidden()
  await orgs.goto('people')
  await expect(orgs.personNamed('Sipho Dlamini')).toBeVisible()
})

test('marks the open organisation and says which email invites are matched to', async ({ orgs }) => {
  await orgs.open()
  await expect(orgs.org(MINE.name)).toContainText('Open now')
  await expect(orgs.openButton(MINE.name)).toBeHidden()
  await expect(orgs.invitesSentTo(ME.email)).toBeVisible()
})

test('several invites are counted, and one can be declined', async ({ orgs, backend }) => {
  const invite = { email: ME.email, role: 'member', created_at: '2026-10-01T00:00:00Z' }
  backend.myInvites.push({ ...invite, id: 'invite-1', org_id: SHARED.id, org_name: SHARED.name })
  backend.myInvites.push({ ...invite, id: 'invite-2', org_id: 'org-other', org_name: 'Other Circle' })
  await orgs.goto('home')

  await expect(orgs.inviteBanner).toContainText("You're invited to join 2 organisations")
  await orgs.seeInvitesButton.click()
  await orgs.declineButton('Other Circle').click()
  await orgs.confirmDecline()
  await expect(orgs.declineButton('Other Circle')).toBeHidden()
  expect(backend.myInvites.map((i) => i.id)).toEqual(['invite-1'])
  await orgs.goto('home')
  await expect(orgs.inviteBanner).toContainText(`You're invited to join ${SHARED.name}`)
})
