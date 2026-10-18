import type { Download, Page } from '@playwright/test'
import { AppPage } from './AppPage'

/** Settings: lending defaults and data (backup / restore). */
export class SettingsPage extends AppPage {
  constructor(page: Page) {
    super(page)
  }

  async open() {
    await this.goto('settings')
  }

  async setLendingDefaults({ period, interest }: { period: string; interest: string }) {
    await this.page.getByLabel('Lending period').selectOption({ label: period })
    await this.page.getByLabel('Interest %').fill(interest)
    await this.page.getByRole('button', { name: 'Save defaults' }).click()
  }

  async downloadBackup(): Promise<Download> {
    const download = this.page.waitForEvent('download')
    await this.page.getByRole('button', { name: 'Download' }).click()
    return download
  }

  /** Choose a backup file, then confirm the "Restore this backup?" dialog. */
  async restoreBackup(path: string) {
    await this.page.locator('input[type="file"]').setInputFiles(path)
    await this.page.getByRole('dialog', { name: 'Restore this backup?' }).getByRole('button', { name: 'Replace and restore' }).click()
  }
}
