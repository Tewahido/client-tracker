import { expect, test } from '../fixtures'

test.describe('dialogs', () => {
  test.beforeEach(async ({ app }) => {
    await app.goto('home')
    await app.openNewLoan()
  })

  test('stay open when a drag that started inside ends over the backdrop', async ({ loanForm }) => {
    await loanForm.amount.fill('1234')
    await loanForm.dragOutOf(loanForm.amount)
    await expect(loanForm.root).toBeVisible()
    await expect(loanForm.amount).toHaveValue('1234')
  })

  test('close on a click on the backdrop and on Escape', async ({ loanForm, app }) => {
    await loanForm.clickBackdrop()
    await expect(loanForm.root).toBeHidden()

    await app.openNewLoan()
    await expect(loanForm.root).toBeVisible()
    await loanForm.pressEscape()
    await expect(loanForm.root).toBeHidden()
  })

  test('are announced by their title', async ({ loanForm }) => {
    await expect(loanForm.root).toHaveAccessibleName('New loan')
    await expect(loanForm.root).toHaveAccessibleDescription(/Record money you lent/)
  })
})
