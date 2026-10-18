import { expect, test } from '../fixtures'

test.describe('lending and repayments', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto('home')
  })

  test('records a loan to a new person, with interest, and shows it everywhere', async ({ app, loanForm, loanDetail, loans }) => {
    await app.openNewLoan()
    await loanForm.create({ person: 'Sipho Dlamini', amount: '1500', interest: '10', note: 'Car repair' })

    await expect(loanDetail.root).toBeVisible()
    await expect(loanDetail.balance).toHaveText(/1,650\.00/)
    await loanDetail.close()

    await loans.open()
    await expect(loans.row('Sipho Dlamini')).toContainText('Car repair')
  })

  test('takes partial payments and celebrates the final one', async ({ app, loanForm, loanDetail, payment }) => {
    await app.openNewLoan()
    await loanForm.create({ person: 'Thandi Nkosi', amount: '1000' })

    await loanDetail.recordPayment()
    await payment.pay('400')
    await expect(loanDetail.balance).toHaveText(/600\.00/)

    await loanDetail.markFullyPaid()
    await expect(app.toast(/all paid up/)).toBeVisible()
    await expect(loanDetail.status('Paid')).toBeVisible()
  })

  test('refuses a payment larger than what is owed', async ({ app, loanForm, loanDetail, payment }) => {
    await app.openNewLoan()
    await loanForm.create({ person: 'Lerato', amount: '200' })
    await loanDetail.recordPayment()
    await payment.amount.fill('250')
    await payment.button('Save payment').click()
    await expect(payment.root.getByText(/more than the .*200\.00 still owed/)).toBeVisible()
  })
})
