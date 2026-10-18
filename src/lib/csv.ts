type Cell = string | number | null | undefined

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  // Neutralise spreadsheet formula injection (cells starting with = + - @).
  const safe = /^[=+\-@]/.test(text) && typeof value === 'string' ? `'${text}` : text
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/** RFC 4180 CSV with a header row. */
export function toCsv(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n'
}
