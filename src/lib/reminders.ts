import { amountDueNowCents, isOpen, type LoanView } from './loans'

/**
 * Reminder "stages" a loan moves through. Each stage notifies at most once, so a
 * user who skips a few days still gets the latest stage instead of a backlog.
 */
export type ReminderStage = 'soon' | 'tomorrow' | 'today' | 'overdue-1' | 'overdue-3' | 'overdue-7' | `overdue-w${number}`

export function reminderStage(daysUntilDue: number, soonDays: number): ReminderStage | null {
  if (daysUntilDue < 0) {
    const late = -daysUntilDue
    if (late >= 14) return `overdue-w${Math.floor(late / 7)}`
    if (late >= 7) return 'overdue-7'
    if (late >= 3) return 'overdue-3'
    return 'overdue-1'
  }
  if (daysUntilDue === 0) return 'today'
  if (daysUntilDue === 1) return 'tomorrow'
  if (daysUntilDue <= soonDays) return 'soon'
  return null
}

export interface Reminder {
  /** Unique per loan, due date and stage; extending the due date starts a fresh cycle. */
  key: string
  loanId: string
  stage: ReminderStage
  title: string
  body: string
}

export function dueReminders(views: LoanView[], soonDays: number, formatMoney: (cents: number) => string): Reminder[] {
  const reminders: Reminder[] = []
  for (const v of views) {
    if (!isOpen(v.status)) continue
    const stage = reminderStage(v.daysUntilDue, soonDays)
    if (!stage) continue
    const name = v.borrower?.name ?? 'Someone'
    const amount = formatMoney(v.balanceCents)
    reminders.push({
      // Keyed by the next due date, so each monthly instalment gets its own reminders.
      key: `${v.loan.id}:${v.nextDueOn}:${stage}`,
      loanId: v.loan.id,
      stage,
      title: reminderTitle(stage, name, v.daysUntilDue),
      body: v.plan
        ? `${formatMoney(amountDueNowCents(v))} due now, ${amount} still owed in total. Tap to open the loan.`
        : `${amount} still owed to you. Tap to open the loan.`,
    })
  }
  return reminders
}

function reminderTitle(stage: ReminderStage, name: string, days: number): string {
  switch (stage) {
    case 'today':
      return `${name}'s payment is due today`
    case 'tomorrow':
      return `${name}'s payment is due tomorrow`
    case 'soon':
      return `${name}'s payment is due in ${days} days`
    default:
      return `${name} is ${-days} ${days === -1 ? 'day' : 'days'} overdue`
  }
}
