import type { Page } from '@playwright/test'

type Route = 'home' | 'loans' | 'people' | 'settings'

/** Things available on every screen: routing, the New loan button, the page heading and toasts. */
export class AppPage {
  /** The visible "New loan" control: sidebar button on desktop, floating button on phones. */
  readonly newLoanButton

  constructor(readonly page: Page) {
    this.newLoanButton = page.getByRole('button', { name: 'New loan' }).locator('visible=true').first()
  }

  async goto(route: Route = 'home') {
    await this.page.goto(`/#${route}`)
  }

  async reload() {
    await this.page.reload()
  }

  heading(name: string) {
    return this.page.getByRole('heading', { level: 1, name })
  }

  async openNewLoan() {
    await this.newLoanButton.click()
  }

  toast(text: string | RegExp) {
    return this.page.locator('[data-sonner-toast]').filter({ hasText: text })
  }
}
