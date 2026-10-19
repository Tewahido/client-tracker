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
