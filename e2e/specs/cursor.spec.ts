import { expect, test } from '../fixtures'

test('clickable controls show a pointer cursor, disabled ones do not', async ({ app, settings }) => {
  await app.goto('home')
  await expect(app.newLoanButton).toHaveCSS('cursor', 'pointer')

  await settings.open()
  // "Save defaults" stays disabled until something changes.
  await expect(settings.saveDefaultsButton).toHaveCSS('cursor', 'not-allowed')
  await expect(settings.themeTab('Dark')).toHaveCSS('cursor', 'pointer')
})

test('disabled buttons do not react to hover', async ({ settings }) => {
  await settings.open()
  const idle = await settings.saveDefaultsBackground({ hovered: false })
  expect(await settings.saveDefaultsBackground({ hovered: true })).toBe(idle)
})
