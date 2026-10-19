import { expect, test as base } from '@playwright/test'
import { SignInPage } from '../../pages/SignInPage'

// Runs in the "auth" projects only: the app is built against a fake Supabase project,
// so the sign-in screen shows. Nothing here needs the network.
const test = base.extend<{ signIn: SignInPage }>({
  signIn: async ({ page }, provide) => provide(new SignInPage(page)),
})

test('explains an expired or already-used sign-in link instead of failing silently', async ({ signIn }) => {
  await signIn.arriveFromEmailLink('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')

  await expect(signIn.heading).toBeVisible()
  await expect(signIn.linkProblem).toContainText('expired or was already used')
  // The error is removed from the address so a refresh doesn't show it again.
  await expect.poll(() => signIn.currentHash()).not.toContain('error')
})

test('shows no warning on a normal visit', async ({ signIn }) => {
  await signIn.open()
  await expect(signIn.heading).toBeVisible()
  await expect(signIn.linkProblem).toHaveCount(0)
})

test('clears the warning once a new link is requested', async ({ signIn }) => {
  await signIn.arriveFromEmailLink('#error=access_denied&error_code=otp_expired')
  await expect(signIn.linkProblem).toBeVisible()
  // The fake project can't send email, but the old warning must go as soon as we ask again.
  await signIn.requestLink('lender@example.com')
  await expect(signIn.linkProblem).toHaveCount(0)
})

test('never displays text taken from the link itself', async ({ signIn }) => {
  await signIn.arriveFromEmailLink('#error=x&error_description=Your+account+is+locked.+Call+0800+123+456')
  await expect(signIn.linkProblem).toContainText("That sign-in link didn't work")
  await expect(signIn.linkProblem).not.toContainText('0800')
})
