import { expect, test as base } from '@playwright/test'
import { OrganisationsPage } from '../../pages/OrganisationsPage'
import { FakeSupabase, ME, ORG } from '../../support/fakeSupabase'

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

test('an invite that arrives after you made your own organisation is shown and can be joined', async ({ orgs, backend }) => {
  backend.myInvites.push({ id: 'invite-1', org_id: SHARED.id, org_name: SHARED.name, email: ME.email, role: 'member', created_at: '2026-10-01T00:00:00Z' })
  await orgs.goto('home')

  await expect(orgs.inviteBanner).toContainText(`${SHARED.name} invited you`)
  await orgs.inviteBanner.getByRole('button', { name: 'See invite' }).click()
  await expect(orgs.heading('Organisations')).toBeVisible()

  await orgs.joinButton(SHARED.name).click()
  await expect(orgs.currentOrgButton()).toContainText(SHARED.name)
  await expect(orgs.inviteBanner).toBeHidden()
  await orgs.goto('people')
  await expect(orgs.personNamed('Sipho Dlamini')).toBeVisible()
})

test('says which email invites are matched to', async ({ orgs }) => {
  await orgs.open()
  await expect(orgs.page.getByText(`Invites are sent to ${ME.email}`)).toBeVisible()
  // ORG is only in other specs' setup: this person isn't in it.
  await expect(orgs.org(ORG.name)).toHaveCount(0)
})
