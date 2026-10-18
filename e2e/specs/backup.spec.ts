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
})
