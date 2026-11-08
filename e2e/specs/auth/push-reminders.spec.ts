import { expect, test as base } from '@playwright/test'
import { ReminderSettings } from '../../pages/ReminderSettings'
import { FakeSupabase } from '../../support/fakeSupabase'

const DEVICE = 'https://push.example/device-1'

// Signed in against a fake Supabase API, with a stand-in for the browser's push service.
const test = base.extend<{ backend: FakeSupabase; reminders: ReminderSettings }>({
  backend: async ({ page }, provide) => {
    const backend = new FakeSupabase(page)
    await backend.signInAsOwner()
    await provide(backend)
  },
  reminders: async ({ page, backend }, provide) => {
    void backend
    const reminders = new ReminderSettings(page)
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
