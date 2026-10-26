import { expect, test } from '../fixtures'

test.describe('controls fit the design', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto('home')
  })

  test('dropdowns use our chevron with room to breathe, not the system arrow', async ({ app, loanForm, loanDetail, loans }) => {
    await app.openNewLoan()
    await expect(loanForm.lentTo).toHaveCSS('appearance', 'none')
    await expect(loanForm.lentTo).toHaveCSS('padding-right', '40px')
    // Text fields keep their padding, and the amount still leaves room for the currency.
    await loanForm.lentTo.selectOption({ label: '+ Someone new' })
    await expect(loanForm.field('Their name')).toHaveCSS('padding-left', '14px')
    await expect(loanForm.field('Their name')).toHaveCSS('padding-right', '14px')
    await expect(loanForm.amount).toHaveCSS('padding-left', '48px')

    // The sort dropdown appears once there are loans to sort.
    await loanForm.create({ person: 'Ayanda', amount: '500' })
    await loanDetail.close()
    await loans.open()
    await expect(loans.sort).toHaveCSS('appearance', 'none')
    await expect(loans.sort).toHaveCSS('padding-right', '40px')
  })

  test('the search box shows its magnifying glass', async ({ app, loanForm, loanDetail, loans }) => {
    await app.openNewLoan()
    await loanForm.create({ person: 'Ayanda', amount: '500' })
    await loanDetail.close()
    await loans.open()
    expect(await loans.searchIconShows()).toBe(true)
  })
})
