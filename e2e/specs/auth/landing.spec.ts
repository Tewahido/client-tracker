import { expect, test as base } from '@playwright/test'
import { LandingPage } from '../../pages/LandingPage'

const test = base.extend<{ landing: LandingPage }>({
  landing: async ({ page }, provide) => provide(new LandingPage(page)),
})

test.describe('landing page', () => {
  test.beforeEach(async ({ landing }) => {
    await landing.open()
  })

  test('greets visitors and explains what Lendly does', async ({ landing }) => {
    await expect(landing.headline).toBeVisible()
    await expect(landing.signUpEmail).toBeVisible()
    await expect(landing.featureCards).toHaveCount(6)
    await expect(landing.steps).toHaveCount(3)
  })

  test('lets a new visitor sign up without a password, right from the hero', async ({ landing }) => {
    await landing.acceptSignInRequests()
    await landing.signUp('new.lender@example.com')
    await expect(landing.checkEmailHeading).toBeVisible()
    await expect(landing.page.getByText('new.lender@example.com')).toBeVisible()
  })

  test('every call to action takes you to the sign-up email field', async ({ landing }) => {
    for (const cta of [landing.navSignIn, landing.trackRealLoan, landing.finalCta]) {
      await landing.page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
      await cta.click()
      await expect(landing.signUpEmail).toBeFocused()
    }
  })

  test('the try-it calculator shows what you would be paid back and when', async ({ landing }) => {
    await landing.useCalculator({ amount: '2000', interest: '5', term: '2 weeks' })
    await expect(landing.calculatorResult).toContainText('2,100.00')
    await expect(landing.calculatorResult).toContainText('100.00 interest')
    await expect(landing.calculatorResult).toContainText('Payment due')

    await landing.calculatorAmount.fill('abc')
    await expect(landing.calculatorResult).toContainText('Enter an amount')
  })

  test('the phone layout never scrolls sideways', async ({ landing }) => {
    // Scroll through so every animated section has entered.
    await landing.section(/See a loan/).scrollIntoViewIfNeeded()
    await landing.finalCta.scrollIntoViewIfNeeded()
    expect(await landing.overflowsHorizontally()).toBe(false)
  })
})

test.describe('landing navigation (desktop)', () => {
  test.skip(({ isMobile }) => !!isMobile, 'section links are in the desktop nav')

  test('nav links scroll to their section', async ({ landing }) => {
    await landing.open()
    await landing.navLink('How it works').click()
    await expect(landing.section(/Three steps/)).toBeInViewport()
    await landing.navLink('Try it').click()
    await expect(landing.section(/See a loan the Lendly way/)).toBeInViewport()
  })
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test.skip(({ isMobile }) => !!isMobile, 'the animated preview only shows on wide screens')

  test('shows the hero preview in its final state straight away', async ({ landing }) => {
    await landing.open()
    // No waiting for timed animations: the reminder is already there.
    await expect(landing.reminderToast).toBeVisible({ timeout: 1000 })
  })
})
