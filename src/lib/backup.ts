import { lastInstalmentOn, MAX_INSTALMENTS, MIN_INSTALMENTS } from './instalments'
import { withLoanDefaults } from './snapshot'
import type { Snapshot } from './types'

const FORMAT = 'lendly-backup'
/** 2 added monthly repayment plans; older apps refuse it rather than silently dropping them. */
const VERSION = 2

export interface Backup {
  format: typeof FORMAT
  version: number
  exportedAt: string
  data: Snapshot
}

export function serializeBackup(data: Snapshot, now = new Date()): string {
  const backup: Backup = { format: FORMAT, version: VERSION, exportedAt: now.toISOString(), data }
  return JSON.stringify(backup, null, 2)
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
/** Amounts must be whole cents above zero, matching the database's check constraints. */
const isPositiveCents = (v: unknown) => Number.isInteger(v) && (v as number) > 0
const isCount = (v: unknown) => Number.isInteger(v) && (v as number) >= MIN_INSTALMENTS && (v as number) <= MAX_INSTALMENTS
/** No plan at all, or a complete one that the database's check would accept too. */
function isPlan(l: Record<string, unknown>): boolean {
  if (l.instalmentCount == null) return l.firstDueOn == null && l.agreedTotalCents == null
  if (!isCount(l.instalmentCount) || !isDate(l.firstDueOn) || !isPositiveCents(l.agreedTotalCents)) return false
  const count = l.instalmentCount as number
  const first = l.firstDueOn as string
  return first >= (l.lentOn as string) && (l.agreedTotalCents as number) >= count && l.dueOn === lastInstalmentOn(first, count)
}

/** Parse and validate a backup file. Throws an Error with a user-facing message when invalid. */
export function parseBackup(text: string): Backup {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("That file isn't a Lendly backup (it's not valid JSON).")
  }
  if (!isObject(parsed) || parsed.format !== FORMAT) throw new Error("That file isn't a Lendly backup.")
  if (typeof parsed.version !== 'number' || parsed.version > VERSION) {
    throw new Error('This backup was made by a newer version of Lendly. Update the app and try again.')
  }

  const data = parsed.data
  if (!isObject(data) || !Array.isArray(data.borrowers) || !Array.isArray(data.loans) || !Array.isArray(data.payments)) {
    throw new Error('The backup is missing people, loans or payments.')
  }

  const bad = (what: string, i: number) => new Error(`The backup has an invalid ${what} (entry ${i + 1}).`)
  data.borrowers.forEach((b, i) => {
    if (!isObject(b) || typeof b.id !== 'string' || typeof b.name !== 'string') throw bad('person', i)
  })
  data.loans.forEach((l, i) => {
    if (!isObject(l) || typeof l.id !== 'string' || typeof l.borrowerId !== 'string' || !isPositiveCents(l.principalCents) || !isDate(l.lentOn) || !isDate(l.dueOn) || !isPlan(l)) {
      throw bad('loan', i)
    }
  })
  data.payments.forEach((p, i) => {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.loanId !== 'string' || !isPositiveCents(p.amountCents) || !isDate(p.paidOn)) {
      throw bad('payment', i)
    }
  })

  for (const [label, rows] of [
    ['people', data.borrowers],
    ['loans', data.loans],
    ['payments', data.payments],
  ] as const) {
    const ids = rows.map((r) => (r as { id: string }).id)
    if (new Set(ids).size !== ids.length) throw new Error(`The backup lists some ${label} more than once.`)
  }

  const backup = parsed as unknown as Backup
  return { ...backup, data: { ...backup.data, loans: backup.data.loans.map(withLoanDefaults) } }
}
