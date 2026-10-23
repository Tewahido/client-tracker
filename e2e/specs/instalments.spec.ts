import { expect, test } from '../fixtures'

test.describe('monthly repayment plans', () => {
  test('works the monthly payment and the total out from each other', async ({ app, loanForm, loanDetail }) => {
    await app.goto('home')
    await app.openNewLoan()
    await loanForm.choosePerson('Bongani')
    await loanForm.amount.fill('20000')
    await loanForm.payBack('Monthly')
    await expect(loanForm.months).toHaveValue('12')

    await loanForm.monthly.fill('2000')
    await expect(loanForm.total).toHaveValue('24000')
    await expect(loanForm.interest).toHaveValue('20')

    await loanForm.total.fill('36000')
    await expect(loanForm.monthly).toHaveValue('3000')

    // The total was typed last, so changing the months spreads it differently.
    await loanForm.months.fill('6')
    await expect(loanForm.monthly).toHaveValue('6000')
    await expect(loanForm.planSummary).toHaveText(/^6 payments of R\s?6,000\.00$/)

    await loanForm.save()
    await expect(loanDetail.balance).toHaveText(/36,000\.00/)
    await expect(loanDetail.instalments).toHaveCount(6)
    await expect(loanDetail.instalment(1)).toContainText('Next')
    await expect(loanDetail.instalment(2)).toContainText('Upcoming')
  })

  test('keeps an existing plan’s first payment date when the loan date is corrected', async ({ app, loanForm, loanDetail, loanEditForm }) => {
    await app.goto('home')
    await app.openNewLoan()
    await loanForm.choosePerson('Zanele')
    await loanForm.amount.fill('6000')
    await loanForm.payBack('Monthly')
    await loanForm.months.fill('6')
    await loanForm.lentOn.fill('2026-07-01')
    await loanForm.save()

    await loanDetail.edit()
    await expect(loanEditForm.firstPayment).toHaveValue('2026-08-01')
    await loanEditForm.lentOn.fill('2026-06-30')
    await expect(loanEditForm.firstPayment).toHaveValue('2026-08-01')
  })

  test('leaves the interest alone after switching back to all at once', async ({ app, loanForm }) => {
    await app.goto('home')
    await app.openNewLoan()
    await loanForm.choosePerson('Ayanda')
    await loanForm.amount.fill('20000')
    await loanForm.payBack('Monthly')
    await loanForm.monthly.fill('2000')
    await expect(loanForm.interest).toHaveValue('20')

    await loanForm.payBack('All at once')
    await loanForm.amount.fill('10000')
    await expect(loanForm.interest).toHaveValue('20')
  })

  test('tracks each instalment and shows the ones that were missed', async ({ app, loanForm, loanDetail, payment, person }) => {
    await app.setToday('2026-10-23')
    await app.goto('home')
    await app.openNewLoan()
    await loanForm.choosePerson('Naledi')
    await loanForm.amount.fill('6000')
    await loanForm.payBack('Monthly')
    await loanForm.months.fill('6')
    // Moving the loan date drags the untouched first payment date along.
    await loanForm.lentOn.fill('2026-07-01')
    await expect(loanForm.firstPayment).toHaveValue('2026-08-01')
    await loanForm.save()

    // 1 Aug, 1 Sep and 1 Oct have passed without a payment.
    await expect(loanDetail.behind).toHaveText(/3 missed instalments · R\s?3,000\.00 behind/)
    await expect(loanDetail.instalment(1)).toContainText('Missed')
    await expect(loanDetail.instalment(3)).toContainText('Missed')
    await expect(loanDetail.instalment(4)).toContainText('Next')
    await expect(loanDetail.status('Overdue')).toBeVisible()
    // Moving the whole plan would wipe this record; changing a plan means editing it.
    await expect(loanDetail.button('+1 week')).toHaveCount(0)

    // The payment form suggests catching up on what was missed.
    await loanDetail.recordPayment()
    await expect(payment.amount).toHaveValue('3000')
    await payment.pay('1000')

    await expect(loanDetail.instalment(1)).toContainText('Paid late')
    await expect(loanDetail.behind).toHaveText(/2 missed instalments · R\s?2,000\.00 behind/)

    await loanDetail.openPerson()
    await expect(person.instalmentHistory).toHaveText('2 missed instalments · 1 paid late')
  })
})
