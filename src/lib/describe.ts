import { formatDate, relativeDays } from './dates'
import type { InstalmentState, PlanProgress } from './instalments'
import { isOpen, type LoanView } from './loans'
import type { ISODate } from './types'

/** Short, friendly description of where a loan stands, e.g. "Overdue by 3 days". */
export function dueLabel(view: Pick<LoanView, 'status' | 'daysUntilDue' | 'settledOn' | 'nextDueOn'>): string {
  const { status, daysUntilDue: d } = view
  switch (status) {
    case 'paid':
      return view.settledOn ? `Paid off ${formatDate(view.settledOn, 'd MMM')}` : 'Paid off'
    case 'written-off':
      return 'Forgiven'
    case 'overdue':
      return `Overdue by ${-d} ${d === -1 ? 'day' : 'days'}`
    case 'due-today':
      return 'Due today'
    default:
      return d === 1 ? 'Due tomorrow' : d <= 30 ? `Due in ${d} days` : `Due ${formatDate(view.nextDueOn, 'd MMM yyyy')}`
  }
}

/** "2 weeks", "3 months", "1 year", or "45 days" for a lending period in days. */
export function periodLabel(days: number): string {
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  if (days % 365 === 0) return unit(days / 365, 'year')
  if (days % 30 === 0) return unit(days / 30, 'month')
  if (days % 7 === 0) return unit(days / 7, 'week')
  return unit(days, 'day')
}

export const INSTALMENT_STATE_LABEL: Record<InstalmentState, string> = {
  paid: 'Paid',
  'paid-late': 'Paid late',
  missed: 'Missed',
  next: 'Next',
  upcoming: 'Upcoming',
  forgiven: 'Forgiven',
}

const paidCount = (plan: PlanProgress) => plan.instalments.filter((i) => i.state === 'paid' || i.state === 'paid-late').length

/** "3 of 12 paid", plus how many are missed, e.g. "3 of 12 paid · 2 missed". */
export function planProgressLabel(plan: PlanProgress): string {
  const label = `${paidCount(plan)} of ${plan.instalments.length} paid`
  return plan.missedCount ? `${label} · ${plan.missedCount} missed` : label
}

/**
 * A loan row's second line. For a plan: missed instalments first (the line is cut
 * off on phones), then progress, the monthly amount and the note. Otherwise the
 * note, else when it was lent.
 */
export function loanSubtitle(view: Pick<LoanView, 'loan' | 'plan'>, formatMoney: (cents: number) => string): string {
  const { loan, plan } = view
  if (!plan) return loan.note ?? `Lent ${formatDate(loan.lentOn, 'd MMM yyyy')}`
  return [
    plan.missedCount ? `${plan.missedCount} missed` : null,
    `${paidCount(plan)} of ${plan.instalments.length} paid`,
    `${formatMoney(plan.instalments[0].amountCents)}/month`,
    loan.note,
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * The "Next payment" tile for a monthly plan. It names the same instalment the
 * plan list marks as next; when payments were missed it says how far behind
 * they are instead, since the banner and list already show which ones.
 */
export function nextPaymentFact(
  view: Pick<LoanView, 'loan' | 'plan' | 'status' | 'nextDueOn' | 'daysUntilDue' | 'settledOn'>,
  formatMoney: (cents: number) => string,
): { label: string; date: ISODate; sub: string; urgent: boolean } {
  const { plan } = view
  if (!plan || !isOpen(view.status)) return { label: 'Last payment', date: view.loan.dueOn, sub: dueLabel(view), urgent: false }

  const upcoming = plan.instalments.find((i) => i.state === 'next')
  const date = upcoming?.dueOn ?? view.nextDueOn
  if (plan.missedCount) return { label: 'Next payment', date, sub: `${formatMoney(plan.arrearsCents)} behind`, urgent: true }
  const number = upcoming?.number ?? plan.next?.number ?? plan.instalments.length
  return {
    label: 'Next payment',
    date,
    sub: `Payment ${number} of ${plan.instalments.length} · ${relativeDays(view.daysUntilDue)}`,
    urgent: false,
  }
}

/** How reliably someone pays their instalments, e.g. "2 missed instalments · 1 paid late"; null with nothing to report. */
export function instalmentHistoryLabel(missed: number, late: number): string | null {
  const parts = []
  if (missed) parts.push(`${missed} missed ${missed === 1 ? 'instalment' : 'instalments'}`)
  if (late) parts.push(`${late} paid late`)
  return parts.length ? parts.join(' · ') : null
}
