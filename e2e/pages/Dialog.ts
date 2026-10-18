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

  async pressEscape() {
    await this.page.keyboard.press('Escape')
  }

  /** Click the dimmed area outside the dialog (top-left corner is outside on every layout). */
  async clickBackdrop() {
    await this.page.mouse.click(4, 4)
  }

  /** Press inside `from`, drag to the backdrop and release there, like selecting text too far. */
  async dragOutOf(from: Locator) {
    const box = await from.boundingBox()
    if (!box) throw new Error('Element is not visible')
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await this.page.mouse.down()
    await this.page.mouse.move(4, 4, { steps: 5 })
    await this.page.mouse.up()
  }

  field(label: string) {
    return this.root.getByLabel(label, { exact: true })
  }

  button(name: string) {
    return this.root.getByRole('button', { name, exact: true })
  }
}
