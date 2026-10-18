import { expect, test } from '../fixtures'

test('new loans start with the lending defaults', async ({ app, settings, loanForm }) => {
  await settings.open()
  await settings.setLendingDefaults({ period: '2 weeks', interest: '12' })
  await expect(app.toast('Defaults saved')).toBeVisible()

  await app.openNewLoan()
  await expect(loanForm.interest).toHaveValue('12')

  const lentOn = new Date(await loanForm.field('Lent on').inputValue())
  const dueOn = new Date(await loanForm.dueOn.inputValue())
  expect((dueOn.getTime() - lentOn.getTime()) / 86_400_000).toBe(14)
})
