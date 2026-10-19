import { shiftDate } from './dates'
import { totalDueCents } from './loans'
import type { ISODate } from './types'

export interface LoanPreviewInput {
  principalCents: number
  /** Flat interest percentage. */
  interestRate: number
  termDays: number
  lentOn: ISODate
  /** Days before the due date that reminders start (the app's default is 3). */
  reminderDays?: number
}

export interface LoanPreview {
  totalDueCents: number
  interestCents: number
  dueOn: ISODate
  /** When the lender gets their first "due soon" reminder (never before the loan starts). */
  firstReminderOn: ISODate
}

/** What a loan would look like in Lendly, for the landing page's "try it" calculator. */
export function previewLoan({ principalCents, interestRate, termDays, lentOn, reminderDays = 3 }: LoanPreviewInput): LoanPreview {
  const total = totalDueCents({ principalCents, interestRate })
  const dueOn = shiftDate(lentOn, termDays)
  const reminder = shiftDate(dueOn, -reminderDays)
  return {
    totalDueCents: total,
    interestCents: total - principalCents,
    dueOn,
    firstReminderOn: reminder < lentOn ? lentOn : reminder,
  }
}

/** Most anyone would lend in the calculator; keeps figures readable and believable. */
export const TRY_IT_MAX_CENTS = 1_000_000_000 // R10,000,000
export const TRY_IT_MAX_RATE = 100

/** A friendly message for the first thing wrong with the calculator inputs, or null. */
export function tryItProblem(principalCents: number | null, interestRate: number): string | null {
  if (principalCents === null || principalCents <= 0) return 'Enter how much you lent.'
  if (principalCents > TRY_IT_MAX_CENTS) return 'Try an amount up to 10 million.'
  if (!Number.isFinite(interestRate) || interestRate < 0 || interestRate > TRY_IT_MAX_RATE) return 'Interest can be anything from 0% to 100%.'
  return null
}
