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
