import type { Locator, Page } from '@playwright/test'
import { AppPage } from './AppPage'

declare global {
  interface Window {
    /** What the stubbed push service saw. */
    __push?: { keyLength: number; unsubscribed: boolean; shown: string[] }
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
      const state = { keyLength: 0, unsubscribed: false, shown: [] as string[] }
      window.__push = state
      let granted = sessionStorage.getItem('stub-permission') === 'granted'
      const grant = () => {
        granted = true
        sessionStorage.setItem('stub-permission', 'granted')
      }
      const endpoint = 'https://web.push.apple.com/device-1'
      const subscription = {
        endpoint,
        toJSON: () => ({ endpoint, keys: { p256dh: 'test-p256dh', auth: 'test-auth' } }),
        unsubscribe: async () => {
          state.unsubscribed = true
          sessionStorage.removeItem('stub-subscribed')
          return true
        },
      } as unknown as PushSubscription
      const pushManager = {
        getSubscription: async () => (sessionStorage.getItem('stub-subscribed') ? subscription : null),
        subscribe: async (options: PushSubscriptionOptionsInit) => {
          if (!granted) throw new DOMException('Permission denied', 'NotAllowedError')
          state.keyLength = (options.applicationServerKey as Uint8Array).byteLength
          sessionStorage.setItem('stub-subscribed', '1')
          return subscription
        },
      }
      const registration = {
        pushManager,
        showNotification: async (title: string) => {
          state.shown.push(title)
        },
      }
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: { ready: Promise.resolve(registration), register: async () => registration, addEventListener() {}, removeEventListener() {} },
      })
      if (!('PushManager' in window)) Object.assign(window, { PushManager: function PushManager() {} })
      Object.defineProperty(Notification, 'permission', { configurable: true, get: () => (granted ? 'granted' : 'default') })
      Notification.requestPermission = async () => {
        grant()
        return 'granted'
      }
    })
  }

  /** The explanation under Notifications. */
  hint(text: string | RegExp) {
    return this.page.getByText(text)
  }

  /** Turn reminders on, then wait until the app has finished setting them up. */
  async turnOn() {
    await this.turnOnButton.click()
    await this.turnOffButton.waitFor()
  }

  readonly stopEverywhereButton = this.page.getByRole('button', { name: 'Stop on all devices' })

  /** The smaller line under a toast's title. */
  toastDescription(text: string | RegExp) {
    return this.page.locator('[data-sonner-toast]').filter({ hasText: text }).locator('[data-description]')
  }

  async pushService() {
    return this.page.evaluate(() => window.__push!)
  }
}
