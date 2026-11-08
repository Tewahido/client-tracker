import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'

declare global {
  interface Window {
    /** What the stubbed push service saw. */
    __push?: { keyLength: number; unsubscribed: boolean }
  }
}

/** The Reminders section of Settings, signed in (Supabase mode). */
export class ReminderSettings extends AppPage {
  readonly turnOnButton: Locator
  readonly turnOffButton: Locator
  readonly reminderWindow: Locator
  readonly signOutButton: Locator

  constructor(page: Page) {
    super(page)
    this.turnOnButton = page.getByRole('button', { name: 'Turn on', exact: true })
    this.turnOffButton = page.getByRole('button', { name: 'Turn off', exact: true })
    this.reminderWindow = page.getByLabel('Start reminding me')
    this.signOutButton = page.getByRole('main').getByRole('button', { name: 'Sign out', exact: true })
  }

  async open() {
    await this.goto('settings')
  }

  /**
   * Stand in for the browser's push service and notification permission (a real one needs
   * Apple's or Google's servers): subscribing grants permission and returns a fixed device.
   * Call before open().
   */
  async stubPushService() {
    await this.page.addInitScript(() => {
      const state = { keyLength: 0, unsubscribed: false }
      window.__push = state
      let granted = false
      let current: PushSubscription | null = null
      const endpoint = 'https://push.example/device-1'
      const subscription = {
        endpoint,
        toJSON: () => ({ endpoint, keys: { p256dh: 'test-p256dh', auth: 'test-auth' } }),
        unsubscribe: async () => {
          state.unsubscribed = true
          current = null
          return true
        },
      } as unknown as PushSubscription
      const pushManager = {
        getSubscription: async () => current,
        subscribe: async (options: PushSubscriptionOptionsInit) => {
          granted = true
          state.keyLength = (options.applicationServerKey as Uint8Array).byteLength
          current = subscription
          return subscription
        },
      }
      const registration = { pushManager, showNotification: async () => {} }
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { ready: Promise.resolve(registration), register: async () => registration, addEventListener() {}, removeEventListener() {} },
      })
      if (!('PushManager' in window)) Object.assign(window, { PushManager: function PushManager() {} })
      Object.defineProperty(Notification, 'permission', { configurable: true, get: () => (granted ? 'granted' : 'default') })
      Notification.requestPermission = async () => {
        granted = true
        return 'granted'
      }
    })
  }

  /** The explanation under Notifications. */
  hint(text: string | RegExp) {
    return this.page.getByText(text)
  }

  async pushService() {
    return this.page.evaluate(() => window.__push!)
  }
}
