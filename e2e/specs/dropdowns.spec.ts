import { expect, test } from '../fixtures'

/** Alpha channel of a computed colour: rgb() is opaque, rgba()/oklab() may carry an alpha. */
function alpha(color: string): number {
  const match = color.match(/\/\s*([\d.]+)\)$|rgba\([^)]*,\s*([\d.]+)\)$/)
  return match ? Number(match[1] ?? match[2]) : 1
}

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`dropdown options in ${scheme} mode`, () => {
    test.use({ colorScheme: scheme })

    test('have a solid background that differs from their text', async ({ settings }) => {
      await settings.open()
      for (const label of ['Currency', 'Lending period', 'Start reminding me']) {
        const { color, background } = await settings.dropdownOptionColors(label)
        // A transparent option background makes Chrome on Windows draw the list white,
        // which hides light text in dark mode.
        expect(alpha(background), `${label} option background ${background}`).toBe(1)
        expect(background, `${label} option text and background`).not.toBe(color)
      }
    })
  })
}
