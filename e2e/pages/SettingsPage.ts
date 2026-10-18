import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
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

  readonly restoreZone = this.page.getByRole('button', { name: 'Restore a backup' })

  /** Choose a backup file through the file picker, then confirm the restore. */
  async restoreBackup(path: string) {
    await this.page.locator('input[type="file"]').setInputFiles(path)
    await this.confirmRestore()
  }

  /** Drag a backup file over the drop zone and drop it (without confirming yet). */
  async dropBackup(path: string, { holdOver = false } = {}) {
    const contents = (await readFile(path)).toString('base64')
    const dataTransfer = await this.page.evaluateHandle(
      ({ contents, name }) => {
        const bytes = Uint8Array.from(atob(contents), (c) => c.charCodeAt(0))
        const transfer = new DataTransfer()
        transfer.items.add(new File([bytes], name, { type: 'application/json' }))
        return transfer
      },
      { contents, name: basename(path) },
    )
    await this.restoreZone.dispatchEvent('dragenter', { dataTransfer })
    await this.restoreZone.dispatchEvent('dragover', { dataTransfer })
    if (holdOver) return
    await this.restoreZone.dispatchEvent('drop', { dataTransfer })
  }

  async confirmRestore() {
    await this.page.getByRole('dialog', { name: 'Restore this backup?' }).getByRole('button', { name: 'Replace and restore' }).click()
  }
}
