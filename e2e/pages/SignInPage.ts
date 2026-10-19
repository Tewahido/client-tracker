import type { Page } from '@playwright/test'

/** The Supabase-mode sign-in screen. */
export class SignInPage {
  readonly heading
  readonly email
  readonly sendLinkButton
  /** Message explaining why the last sign-in link didn't work. */
  readonly linkProblem

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Welcome' })
    this.email = page.getByLabel('Email', { exact: true })
    this.sendLinkButton = page.getByRole('button', { name: 'Email me a sign-in link' })
    this.linkProblem = page.getByRole('alert')
  }

  /** Arrive the way Supabase redirects back after a sign-in link, e.g. with an error in the hash. */
  async arriveFromEmailLink(hash: string) {
    await this.page.goto(`/${hash}`)
  }

  async open() {
    await this.page.goto('/')
  }

  async currentHash(): Promise<string> {
    return this.page.evaluate(() => window.location.hash)
  }
}
