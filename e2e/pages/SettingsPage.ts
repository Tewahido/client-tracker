import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import type { Download, JSHandle, Page } from '@playwright/test'
import { AppPage } from './AppPage'

/** Settings: lending defaults, appearance and data (backup / restore). */
export class SettingsPage extends AppPage {
  constructor(page: Page) {
    super(page)
  }

  readonly saveDefaultsButton = this.page.getByRole('button', { name: 'Save defaults' })
  readonly restoreZone = this.page.getByRole('button', { name: 'Restore a backup' })
  readonly restoreDialog = this.page.getByRole('dialog', { name: 'Restore this backup?' })

  async open() {
    await this.goto('settings')
  }

  themeTab(name: 'Auto' | 'Light' | 'Dark') {
    return this.page.getByRole('tab', { name })
  }

  async setLendingDefaults({ period, interest }: { period: string; interest: string }) {
    await this.page.getByLabel('Lending period').selectOption({ label: period })
    await this.page.getByLabel('Interest %').fill(interest)
    await this.saveDefaultsButton.click()
  }

  async downloadBackup(): Promise<Download> {
    const download = this.page.waitForEvent('download')
    await this.page.getByRole('button', { name: 'Download' }).click()
    return download
  }

  /** Click the drop zone, pick the file in the file chooser, then confirm the restore. */
  async restoreBackup(path: string) {
    const chooser = this.page.waitForEvent('filechooser')
    await this.restoreZone.click()
    await (await chooser).setFiles(path)
    await this.confirmRestore()
  }

  async confirmRestore() {
    await this.restoreDialog.getByRole('button', { name: 'Replace and restore' }).click()
  }

  async restoreZoneBorderColor(): Promise<string> {
    return this.restoreZone.evaluate((el) => getComputedStyle(el).borderTopColor)
  }

  /** A browser DataTransfer holding the file at `path`, as the OS would supply when dragging it. */
  async fileTransfer(path: string): Promise<JSHandle<DataTransfer>> {
    const contents = (await readFile(path)).toString('base64')
    return this.page.evaluateHandle(
      ({ contents, name }) => {
        const bytes = Uint8Array.from(atob(contents), (c) => c.charCodeAt(0))
        const transfer = new DataTransfer()
        transfer.items.add(new File([bytes], name, { type: 'application/json' }))
        return transfer
      },
      { contents, name: basename(path) },
    )
  }

  /** Drag a file onto the drop zone and hold it there. */
  async dragFileOver(transfer: JSHandle<DataTransfer>) {
    await this.restoreZone.dispatchEvent('dragenter', { dataTransfer: transfer })
    await this.restoreZone.dispatchEvent('dragover', { dataTransfer: transfer })
  }

  /** Move the held file onto the zone's text: the browser enters the child, then leaves the zone. */
  async dragOntoZoneText(transfer: JSHandle<DataTransfer>) {
    const text = this.restoreZone.getByText('Drop to continue')
    await text.dispatchEvent('dragenter', { dataTransfer: transfer })
    await this.restoreZone.dispatchEvent('dragleave', { dataTransfer: transfer })
  }

  /** Move the held file from the zone's text off the zone entirely. */
  async dragOffZoneText(transfer: JSHandle<DataTransfer>) {
    await this.restoreZone.getByText('Drop to continue').dispatchEvent('dragleave', { dataTransfer: transfer })
  }

  async dropFile(transfer: JSHandle<DataTransfer>) {
    await this.restoreZone.dispatchEvent('drop', { dataTransfer: transfer })
  }

  /** Drag the file at `path` onto the zone and drop it (without confirming yet). */
  async dropBackup(path: string) {
    const transfer = await this.fileTransfer(path)
    await this.dragFileOver(transfer)
    await this.dropFile(transfer)
  }

  /** Drop a file on the page next to the zone; resolves to whether the app stopped the browser opening it. */
  async dropBesideZone(path: string): Promise<boolean> {
    const transfer = await this.fileTransfer(path)
    return this.page.evaluate(
      (dataTransfer) => !document.body.dispatchEvent(new DragEvent('drop', { dataTransfer, bubbles: true, cancelable: true })),
      transfer,
    )
  }
}
