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

  test('search and sort fit the screen and show keyboard focus alike', async ({ app, loanForm, loanDetail, loans }, testInfo) => {
    await app.openNewLoan()
    await loanForm.create({ person: 'Ayanda', amount: '500' })
    await loanDetail.close()
    await loans.open()

    // On phones the search gets its own full-width row, so its placeholder isn't cut off.
    const search = (await loans.search.boundingBox())!
    const sort = (await loans.sort.boundingBox())!
    if (testInfo.project.name === 'mobile') {
      expect(sort.y).toBeGreaterThanOrEqual(search.y + search.height)
      expect(search.width).toBeGreaterThan(300)
    } else {
      expect(Math.abs(sort.y - search.y)).toBeLessThan(2)
    }

    expect(await loans.focusedBorderColor(loans.sort)).toBe(await loans.focusedBorderColor(loans.search))
  })

  // iPhone Safari zooms in when a field under 16px is tapped, and stays zoomed, cutting screens off.
  test('form fields are big enough on touch screens that iPhones don’t zoom in', async ({ app, loanForm, loanDetail, loans }, testInfo) => {
    const expected = testInfo.project.name === 'mobile' ? '16px' : '14px'
    await app.openNewLoan()
    await expect(loanForm.lentTo).toHaveCSS('font-size', expected)
    await expect(loanForm.amount).toHaveCSS('font-size', expected)
    await expect(loanForm.field('Note')).toHaveCSS('font-size', expected)
    await loanForm.create({ person: 'Ayanda', amount: '500' })
    await loanDetail.close()
    await loans.open()
    await expect(loans.search).toHaveCSS('font-size', expected)
    await expect(loans.sort).toHaveCSS('font-size', expected)
  })

  test('the search box shows its magnifying glass', async ({ app, loanForm, loanDetail, loans }) => {
    await app.openNewLoan()
    await loanForm.create({ person: 'Ayanda', amount: '500' })
    await loanDetail.close()
    await loans.open()
    expect(await loans.searchIconShows()).toBe(true)
  })
})
