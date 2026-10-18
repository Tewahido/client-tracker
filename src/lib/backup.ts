import type { Snapshot } from './types'

const FORMAT = 'lendly-backup'
const VERSION = 1

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
const isInt = (v: unknown) => Number.isInteger(v) && (v as number) >= 0

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
    if (!isObject(l) || typeof l.id !== 'string' || typeof l.borrowerId !== 'string' || !isInt(l.principalCents) || !isDate(l.lentOn) || !isDate(l.dueOn)) {
      throw bad('loan', i)
    }
  })
  data.payments.forEach((p, i) => {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.loanId !== 'string' || !isInt(p.amountCents) || !isDate(p.paidOn)) {
      throw bad('payment', i)
    }
  })

  return parsed as unknown as Backup
}
