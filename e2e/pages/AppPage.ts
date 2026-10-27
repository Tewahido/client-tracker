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

  /** Pretend today is `date` (YYYY-MM-DD, mid-morning in Johannesburg). Call before goto(). */
  async setToday(date: string) {
    await this.page.clock.setFixedTime(new Date(`${date}T10:00:00+02:00`))
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

  /** The page itself (the <html> element), for page-wide styles such as touch-action. */
  get document() {
    return this.page.locator('html')
  }

  /** The viewport meta tag's settings, e.g. "width=device-width, initial-scale=1". */
  async viewportSetting(): Promise<string> {
    return (await this.page.locator('meta[name="viewport"]').getAttribute('content')) ?? ''
  }

  /** The Home screen's summary card ("Out with people right now"). */
  get summaryCard() {
    return this.page.getByRole('region', { name: 'Summary' })
  }

  /**
   * Whether a rounded card's glows sit in a masked layer that clips them to its corners
   * (iPhone Safari otherwise shows blurred glows as grey squares poking out of the corner).
   */
  async glowsClipped(card: ReturnType<Page['locator']>): Promise<boolean> {
    return card.evaluate((el) => {
      const layer = el.querySelector(':scope > [data-decorations]')
      if (!layer) return false
      const style = getComputedStyle(layer)
      const mask = style.maskImage || style.getPropertyValue('-webkit-mask-image')
      return style.overflow === 'hidden' && mask !== 'none' && layer.querySelector('[class*="blur-"]') !== null
    })
  }

  toast(text: string | RegExp) {
    return this.page.locator('[data-sonner-toast]').filter({ hasText: text })
  }
}
