import { expect, test as base } from '@playwright/test'
import { ReminderSettings } from '../../pages/ReminderSettings'
import { FakeSupabase, ME, ORG } from '../../support/fakeSupabase'

const DEVICE = 'https://web.push.apple.com/device-1'
const TODAY = '2026-11-08'

// Signed in against a fake Supabase API, with a stand-in for the browser's push service.
const test = base.extend<{ backend: FakeSupabase; reminders: ReminderSettings }>({
  backend: async ({ page }, provide) => {
    const backend = new FakeSupabase(page)
    // A loan due today, so the app's own check has something to remind about.
    backend.people[ORG.id] = ['Sipho Dlamini']
    backend.loans[ORG.id] = [['loan-1', 0, TODAY]]
    await backend.signInAsOwner()
    await provide(backend)
  },
  reminders: async ({ page, backend }, provide) => {
    void backend
    const reminders = new ReminderSettings(page)
    await reminders.setToday(TODAY)
    await reminders.stubPushService()
    await reminders.open()
    await provide(reminders)
  },
})

test('turning on reminders saves this device, so they arrive with the app closed', async ({ reminders, backend }) => {
  await reminders.turnOnButton.click()

  await expect(reminders.hint(/^On for this device, even when Lendly is closed/)).toBeVisible()
  expect(backend.pushSaves.at(-1)).toEqual({ p_endpoint: DEVICE, p_p256dh: 'test-p256dh', p_auth: 'test-auth', p_reminder_days: 3 })
  // The app subscribed with the 65-byte VAPID public key.
  expect((await reminders.pushService()).keyLength).toBe(65)
})

// The server sends reminders to a device with push; the app showing them too would double up.
test('with push on, the app does not repeat reminders the server sends', async ({ reminders }) => {
  await reminders.turnOn()
  // The app checks as soon as reminders turn on and whenever it opens; give it time to (wrongly) notify.
  await reminders.page.waitForTimeout(1500)
  expect((await reminders.pushService()).shown).toEqual([])

  await reminders.reload()
  await expect(reminders.turnOffButton).toBeVisible()
  await reminders.page.waitForTimeout(1500)
  expect((await reminders.pushService()).shown).toEqual([])
})

test('falls back to reminders while Lendly is open when this device cannot be saved', async ({ reminders, backend }) => {
  backend.failPushSave = true
  await reminders.turnOnButton.click()

  // A readable warning, with no browser error text, then the app's own reminders take over.
  const warning = reminders.toastDescription(/try again next time you open it/)
  await expect(warning).toBeVisible()
  await expect(warning).toHaveCSS('color', 'rgb(146, 64, 14)')
  await expect(reminders.hint(/aren't working on this device yet/)).toBeVisible()
  await expect.poll(async () => (await reminders.pushService()).shown).toEqual(["Sipho Dlamini's payment is due today"])
})

test('a dropped connection when Lendly opens does not bring back duplicate reminders', async ({ reminders, backend }) => {
  await reminders.turnOn()
  backend.failPushSave = true
  await reminders.reload()
  await expect(reminders.hint(/^On for this device, even when Lendly is closed/)).toBeVisible()
  await reminders.page.waitForTimeout(1500)
  expect((await reminders.pushService()).shown).toEqual([])
})

test('a lost phone can be cut off from every other device', async ({ reminders, backend }) => {
  await reminders.turnOn()
  await reminders.stopEverywhereButton.click()
  await expect.poll(() => backend.pushRemoved).toEqual([`all:${ME.id}`])
  await expect(reminders.toast('Reminders stopped on all your devices')).toBeVisible()
})

test('changing how early to remind updates the saved device', async ({ reminders, backend }) => {
  await reminders.turnOnButton.click()
  await expect(reminders.turnOffButton).toBeVisible()

  await reminders.reminderWindow.selectOption({ label: '7 days before the due date' })
  await expect.poll(() => backend.pushSaves.at(-1)?.p_reminder_days).toBe(7)
})

test('turning reminders off removes this device', async ({ reminders, backend }) => {
  await reminders.turnOnButton.click()
  await reminders.turnOffButton.click()

  await expect.poll(() => backend.pushRemoved).toEqual([DEVICE])
  expect((await reminders.pushService()).unsubscribed).toBe(true)
  await expect(reminders.turnOnButton).toBeVisible()
})

test('signing out stops this device getting your reminders', async ({ reminders, backend }) => {
  await reminders.turnOnButton.click()
  await expect(reminders.turnOffButton).toBeVisible()

  await reminders.signOutButton.click()
  await expect.poll(() => backend.pushRemoved).toEqual([DEVICE])
})

test.describe('in Safari on an iPhone, before adding to the Home Screen', () => {
  test.use({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })

  test('explains that reminders need the Home Screen app', async ({ reminders }) => {
    await expect(reminders.hint(/add Lendly to your Home Screen first/)).toBeVisible()
  })
})
