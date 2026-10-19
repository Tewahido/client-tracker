import type { Locator, Page } from '@playwright/test'

/** The signed-out landing page (Supabase mode), including its built-in sign-up card. */
export class LandingPage {
  readonly headline: Locator
  readonly signUpCard: Locator
  readonly signUpEmail: Locator
  readonly signUpButton: Locator
  readonly checkEmailHeading: Locator
  readonly navSignIn: Locator
  readonly featureCards: Locator
  readonly steps: Locator
  readonly reminderToast: Locator
  readonly calculatorAmount: Locator
  readonly calculatorInterest: Locator
  readonly calculatorTerm: Locator
  readonly calculatorResult: Locator
  readonly trackRealLoan: Locator
  readonly finalCta: Locator

  constructor(readonly page: Page) {
    this.headline = page.getByRole('heading', { level: 1, name: /Lend money/ })
    this.signUpCard = page.getByRole('heading', { name: 'Get started free' }).locator('..')
    this.signUpEmail = page.getByLabel('Email', { exact: true })
    this.signUpButton = page.getByRole('button', { name: 'Email me a sign-in link' })
    this.checkEmailHeading = page.getByRole('heading', { name: 'Check your email' })
    this.navSignIn = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Sign in' })
    this.featureCards = page.getByRole('region', { name: /Everything you need/ }).getByRole('listitem')
    this.steps = page.getByRole('region', { name: /Three steps/ }).getByRole('listitem')
    this.reminderToast = page.getByText(/payment is due Friday/)
    const tryIt = page.getByRole('region', { name: /See a loan the Lendly way/ })
    this.calculatorAmount = tryIt.getByLabel('Amount lent')
    this.calculatorInterest = tryIt.getByLabel('Interest %')
    this.calculatorTerm = tryIt.getByLabel('Pay back in')
    this.calculatorResult = tryIt.locator('[aria-live="polite"]')
    this.trackRealLoan = tryIt.getByRole('button', { name: 'Track a real loan' })
    this.finalCta = page.getByRole('button', { name: /Get started, it's free/ })
  }

  async open() {
    await this.page.goto('/')
  }

  navLink(name: 'Features' | 'How it works' | 'Try it') {
    return this.page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name })
  }

  section(name: RegExp) {
    return this.page.getByRole('region', { name })
  }

  /** Make Supabase's "send me a link" endpoint succeed without sending a real email. */
  async acceptSignInRequests() {
    await this.page.route('**/auth/v1/otp**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  }

  async signUp(email: string) {
    await this.signUpEmail.fill(email)
    await this.signUpButton.click()
  }

  async useCalculator({ amount, interest, term }: { amount: string; interest: string; term: string }) {
    await this.calculatorAmount.fill(amount)
    await this.calculatorInterest.fill(interest)
    await this.calculatorTerm.selectOption({ label: term })
  }

  /** Whether the sign-up card is showing its "you are here" highlight. */
  async signUpHighlighted(): Promise<boolean> {
    return (await this.page.locator('[data-highlighted]').count()) > 0
  }

  /** True when the calculator's figures don't fit their card (clipped or overflowing). */
  async calculatorOverflows(): Promise<boolean> {
    // Text wider than its box (e.g. a long amount that can't wrap) shows up as scrollWidth > clientWidth.
    return this.calculatorResult.evaluate((card) =>
      Array.from(card.querySelectorAll<HTMLElement>('*')).some((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1),
    )
  }

  /** True when the page is wider than the screen (sideways scrolling on phones). */
  async overflowsHorizontally(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  }
}
