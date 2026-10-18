import type { Locator, Page } from '@playwright/test'

/** Base page object for the app's modal dialogs, found by their accessible name (the title). */
export abstract class Dialog {
  readonly root: Locator

  protected constructor(
    protected readonly page: Page,
    title: string,
  ) {
    this.root = page.getByRole('dialog', { name: title })
  }

  async close() {
    await this.root.getByRole('button', { name: 'Close' }).click()
  }

  field(label: string) {
    return this.root.getByLabel(label, { exact: true })
  }

  button(name: string) {
    return this.root.getByRole('button', { name, exact: true })
  }
}
