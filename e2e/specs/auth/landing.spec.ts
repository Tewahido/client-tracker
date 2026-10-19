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
    await expect(landing.text('new.lender@example.com')).toBeVisible()
  })

  test('every call to action takes you to the sign-up email field', async ({ landing }) => {
    for (const cta of [landing.navSignIn, landing.trackRealLoan, landing.finalCta]) {
      await landing.clearFocus()
      // Start each check from an un-highlighted card, or a leftover highlight would pass it.
      await expect.poll(() => landing.signUpHighlighted(), { timeout: 4000 }).toBe(false)
      await cta.click()
      await expect(landing.signUpEmail).toBeFocused()
      // A visible cue shows where the button took you.
      await expect.poll(() => landing.signUpHighlighted()).toBe(true)
    }
  })

  test('the try-it calculator shows what you would be paid back and when', async ({ landing }) => {
    await landing.useCalculator({ amount: '2000', interest: '5', term: '2 weeks' })
    await expect(landing.calculatorResult).toContainText('2,100.00')
    await expect(landing.calculatorResult).toContainText('100.00 interest')
    await expect(landing.calculatorResult).toContainText('Payment due')

    await landing.calculatorAmount.fill('abc')
    await expect(landing.calculatorResult).toContainText('Enter how much you lent.')
    await landing.useCalculator({ amount: '1500', interest: '250', term: '1 month' })
    await expect(landing.calculatorResult).toContainText('Interest can be anything from 0% to 100%.')
    await landing.useCalculator({ amount: '99999999', interest: '10', term: '1 month' })
    await expect(landing.calculatorResult).toContainText('Try an amount up to 10 million.')
  })

  test('the largest allowed amount still fits its card', async ({ landing }) => {
    await landing.useCalculator({ amount: '10000000', interest: '100', term: '3 months' })
    await expect(landing.calculatorResult).toContainText('20,000,000.00')
    expect(await landing.calculatorOverflows()).toBe(false)
  })

  test('the Sign in button is big enough to tap on phones', async ({ landing, isMobile }) => {
    test.skip(!isMobile, 'touch target size matters on phones')
    const box = await landing.navSignIn.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test('the phone layout never scrolls sideways', async ({ landing }) => {
    // Scroll through so every animated section has entered.
    await landing.section(/See a loan/).scrollIntoViewIfNeeded()
    await landing.finalCta.scrollIntoViewIfNeeded()
    expect(await landing.overflowsHorizontally()).toBe(false)
  })
})

test.describe('sign-up highlight timing', () => {
  test('clicking another call to action restarts the highlight', async ({ landing }) => {
    await landing.controlTime()
    await landing.open()
    await landing.navSignIn.click()
    await landing.advanceTime(1200)
    await landing.navSignIn.click()
    // 2.2 s after the first click, but only 1 s after the second: still highlighted.
    await landing.advanceTime(1000)
    expect(await landing.signUpHighlighted()).toBe(true)
    await landing.advanceTime(1000)
    expect(await landing.signUpHighlighted()).toBe(false)
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
    await expect(landing.headline).toBeVisible()
    // No timed animations: the reminder is fully shown straight away (normally it waits ~1.5 s).
    await expect(landing.reminderToast).toHaveCSS('opacity', '1', { timeout: 300 })
  })
})
