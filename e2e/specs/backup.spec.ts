import { writeFile } from 'node:fs/promises'
import { expect, test } from '../fixtures'

test('restores a backup and keeps working with the restored loans', async ({ app, loanForm, loanDetail, loans, payment, settings }, testInfo) => {
  await app.goto('home')
  await app.openNewLoan()
  await loanForm.create({ person: 'Backed Up', amount: '500' })
  await loanDetail.close()

  await settings.open()
  const backupPath = testInfo.outputPath('backup.json')
  await (await settings.downloadBackup()).saveAs(backupPath)

  // Change things after the backup was taken.
  await app.openNewLoan()
  await loanForm.create({ person: 'After Backup', amount: '900' })
  await loanDetail.close()

  await settings.open()
  await settings.restoreBackup(backupPath)
  await expect(app.toast('Backup restored')).toBeVisible()

  await loans.open()
  await expect(loans.row('Backed Up')).toBeVisible()
  await expect(loans.row('After Backup')).toHaveCount(0)

  // The restored loan must still accept changes.
  await loans.row('Backed Up').click()
  await loanDetail.recordPayment()
  await payment.pay('200')
  await expect(loanDetail.balance).toHaveText(/300\.00/)

  // After a reload the payment must still belong to the restored loan (not a stale id).
  await app.page.reload()
  await loans.open()
  await loans.row('Backed Up').click()
  await expect(loanDetail.balance).toHaveText(/300\.00/)
})

test('restores a backup dropped onto the drop zone', async ({ app, loans, settings }) => {
  await settings.open()

  const idleBorder = await settings.restoreZone.evaluate((el) => getComputedStyle(el).borderTopColor)
  await settings.dropBackup('samples/lendly-sample-backup.json', { holdOver: true })
  await expect(settings.restoreZone).toContainText('Drop to continue')
  // The zone must visibly light up, not just change its text.
  await expect(settings.restoreZone).not.toHaveCSS('border-top-color', idleBorder)

  await settings.dropBackup('samples/lendly-sample-backup.json')
  await expect(app.page.getByRole('dialog', { name: 'Restore this backup?' })).toContainText('8 loans')
  await settings.confirmRestore()
  await expect(app.toast('Backup restored')).toBeVisible()

  await loans.open()
  await loans.filter('All')
  await expect(loans.row('Lerato Mokoena')).toBeVisible()
  await expect(loans.row('Bongani Zulu')).toContainText('Forgiven')
})

test('rejects a file that is not a backup', async ({ app, settings }, testInfo) => {
  const notABackup = testInfo.outputPath('notes.json')
  await writeFile(notABackup, '{"hello":"world"}')
  await settings.open()
  await settings.dropBackup(notABackup)
  await expect(app.toast("That file isn't a Lendly backup.")).toBeVisible()
  await expect(app.page.getByRole('dialog', { name: 'Restore this backup?' })).toHaveCount(0)
})

test('a file dropped beside the drop zone does not navigate away from the app', async ({ page, settings }) => {
  await settings.open()
  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer()
    transfer.items.add(new File(['{}'], 'stray.json', { type: 'application/json' }))
    return transfer
  })
  const prevented = await page.evaluate(
    (transfer) => !document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true })),
    dataTransfer,
  )
  expect(prevented).toBe(true)
})
