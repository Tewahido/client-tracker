/** Parse user input like "1,250.5" into integer cents. Returns null when invalid. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, '')
  if (cleaned === '' || cleaned === '.' || !/^\d*(\.\d{0,2})?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 100)
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.00$/, '')
}

const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(cents: number, currency: string, options: { compact?: boolean } = {}): string {
  const key = `${currency}:${options.compact ? 'c' : 'f'}`
  let formatter = formatters.get(key)
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        notation: options.compact ? 'compact' : 'standard',
        maximumFractionDigits: options.compact ? 1 : 2,
      })
    } catch {
      // Unknown currency code: fall back to a plain number with the code appended.
      const plain = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
      formatter = { format: (n: number) => `${plain.format(n)} ${currency}` } as Intl.NumberFormat
    }
    formatters.set(key, formatter)
  }
  return formatter.format(cents / 100)
}
