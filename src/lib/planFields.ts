import { splitTotal } from './instalments'
import { centsToInput, parseMoney } from './money'

/** The loan form's linked figures, as typed (strings). */
export interface PlanFields {
  amount: string
  interestRate: string
  months: string
  monthly: string
  total: string
}

/**
 * The figure the lender typed last, which the others follow:
 * - `rate`: total = amount + interest, monthly = total / months
 * - `total`: monthly = total / months, interest = what the total adds to the amount
 * - `monthly`: total = monthly x months, interest likewise
 */
export type PlanAnchor = 'rate' | 'total' | 'monthly'

/** Which anchor a field becomes when the lender edits it; other fields keep the current one. */
export function anchorFor(field: keyof PlanFields, current: PlanAnchor): PlanAnchor {
  if (field === 'interestRate') return 'rate'
  if (field === 'total' || field === 'monthly') return field
  return current
}

/** Whole months from the input, or null. */
export function parseMonths(input: string): number | null {
  if (!/^\s*\d+\s*$/.test(input)) return null
  const months = Number(input)
  return months > 0 ? months : null
}

/** Interest that `totalCents` adds to `principalCents`, as a percentage with at most two decimals. */
export function impliedRate(principalCents: number, totalCents: number): number {
  return Math.round(((totalCents - principalCents) / principalCents) * 10_000) / 100
}

const money = (cents: number | null) => (cents === null ? '' : centsToInput(cents))

/**
 * Recompute the figures that follow from the anchor, so monthly x months = total
 * and the interest matches. The anchor field itself is never rewritten, so it
 * doesn't jump around while being typed. Figures that can't be worked out yet
 * are cleared rather than left stale.
 */
export function reconcilePlan(fields: PlanFields, anchor: PlanAnchor): PlanFields {
  const principal = parseMoney(fields.amount)
  const months = parseMonths(fields.months)
  const perMonth = (total: number | null) => (total !== null && months ? splitTotal(total, months).regularCents : null)

  if (anchor === 'rate') {
    const rate = Number(fields.interestRate || 0)
    const total = principal && Number.isFinite(rate) ? Math.round(principal * (1 + rate / 100)) : null
    return { ...fields, total: money(total), monthly: money(perMonth(total)) }
  }

  const monthly = parseMoney(fields.monthly)
  const total = anchor === 'total' ? parseMoney(fields.total) : monthly !== null && months ? monthly * months : null
  const interestRate = principal && total ? String(impliedRate(principal, total)) : fields.interestRate
  return anchor === 'total'
    ? { ...fields, interestRate, monthly: money(perMonth(total)) }
    : { ...fields, interestRate, total: money(total) }
}
