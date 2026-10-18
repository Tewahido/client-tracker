import { writeFile } from 'node:fs/promises'
import { expect, test } from '../fixtures'

const SAMPLE = 'samples/lendly-sample-backup.json'

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
  await app.reload()
  await loans.open()
  await loans.row('Backed Up').click()
  await expect(loanDetail.balance).toHaveText(/300\.00/)
})

test('restores a backup dropped onto the drop zone', async ({ app, loans, settings }) => {
  await settings.open()
  const idleBorder = await settings.restoreZoneBorderColor()

  const transfer = await settings.fileTransfer(SAMPLE)
  await settings.dragFileOver(transfer)
  await expect(settings.restoreZone).toContainText('Drop to continue')
  // The zone must visibly light up, not just change its text.
  await expect(settings.restoreZone).not.toHaveCSS('border-top-color', idleBorder)

  await settings.dropFile(transfer)
  await expect(settings.restoreDialog).toContainText('8 loans')
  await settings.confirmRestore()
  await expect(app.toast('Backup restored')).toBeVisible()

  await loans.open()
  await loans.filter('All')
  await expect(loans.row('Lerato Mokoena')).toBeVisible()
  await expect(loans.row('Bongani Zulu')).toContainText('Forgiven')
})

test('stays highlighted while a dragged file moves over the zone text, and resets when it leaves', async ({ settings }) => {
  await settings.open()
  const transfer = await settings.fileTransfer(SAMPLE)

  await settings.dragFileOver(transfer)
  await settings.dragOntoZoneText(transfer)
  await expect(settings.restoreZone).toContainText('Drop to continue')

  await settings.dragOffZoneText(transfer)
  await expect(settings.restoreZone).toContainText('Restore a backup')
})

test('rejects a file that is not a backup', async ({ app, settings }, testInfo) => {
  const notABackup = testInfo.outputPath('notes.json')
  await writeFile(notABackup, '{"hello":"world"}')
  await settings.open()
  await settings.dropBackup(notABackup)
  await expect(app.toast("That file isn't a Lendly backup.")).toBeVisible()
  await expect(settings.restoreDialog).toHaveCount(0)
})

test('a file dropped beside the drop zone does not navigate away from the app', async ({ settings }) => {
  await settings.open()
  expect(await settings.dropBesideZone(SAMPLE)).toBe(true)
})
