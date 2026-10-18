import { expect, test } from '../fixtures'

test('clickable controls show a pointer cursor, disabled ones do not', async ({ app, page, settings }) => {
  await app.goto('home')
  const newLoan = page.getByRole('button', { name: 'New loan' }).locator('visible=true').first()
  await expect(newLoan).toHaveCSS('cursor', 'pointer')

  await settings.open()
  // "Save defaults" stays disabled until something changes.
  await expect(page.getByRole('button', { name: 'Save defaults' })).toHaveCSS('cursor', 'not-allowed')
  await expect(page.getByRole('tab', { name: 'Dark' })).toHaveCSS('cursor', 'pointer')
})
