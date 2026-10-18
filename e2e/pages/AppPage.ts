import type { Page } from '@playwright/test'

type Route = 'home' | 'loans' | 'people' | 'settings'

/** Things available on every screen: routing, the New loan button, the page heading and toasts. */
export class AppPage {
  constructor(readonly page: Page) {}

  async goto(route: Route = 'home') {
    await this.page.goto(`/#${route}`)
  }

  heading(name: string) {
    return this.page.getByRole('heading', { level: 1, name })
  }

  /** The visible "New loan" control: sidebar button on desktop, floating button on phones. */
  async openNewLoan() {
    await this.page.getByRole('button', { name: 'New loan' }).locator('visible=true').first().click()
  }

  toast(text: string | RegExp) {
    return this.page.locator('[data-sonner-toast]').filter({ hasText: text })
  }
}
