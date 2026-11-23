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
  /** The loan's organisation, when it may not be the one open on the device (reminders sent by the server). */
  orgId?: string
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
        ? `${formatMoney(amountDueNowCents(v))} due now, ${amount} still owed in total.`
        : `${amount} still owed.`,
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

export interface OutgoingNotification {
  title: string
  body: string
  tag: string
  url: string
  /** Reminder keys this notification covers; logged only once it was shown. */
  keys: string[]
}

/** Above this many new reminders at once, send one summary instead of a burst. */
export const MAX_INDIVIDUAL = 3

export function planNotifications(reminders: Reminder[]): OutgoingNotification[] {
  if (reminders.length > MAX_INDIVIDUAL) {
    return [
      {
        title: `${reminders.length} loans need your attention`,
        body: [...reminders.slice(0, 3).map((r) => r.title), `and ${reminders.length - 3} more`].join('\n'),
        // A notification with an existing tag silently replaces it (no banner on iOS), so each
        // batch of reminders gets its own; reminders are only ever sent once, so batches differ.
        tag: `lendly-summary-${fingerprint(reminders.map((r) => r.key).join('|'))}`,
        url: `#loans?status=open${withOrg(sharedOrg(reminders))}`,
        keys: reminders.map((r) => r.key),
      },
    ]
  }
  return reminders.map((r) => ({ title: r.title, body: r.body, tag: r.key, url: `#loans?open=${r.loanId}${withOrg(r.orgId)}`, keys: [r.key] }))
}

const withOrg = (orgId: string | undefined) => (orgId ? `&org=${orgId}` : '')

/** A short, stable label for a piece of text (FNV-1a), to keep notification tags short. */
function fingerprint(text: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193)
  return (hash >>> 0).toString(36)
}

/** The organisation all the reminders belong to, if they share one. */
function sharedOrg(reminders: Reminder[]): string | undefined {
  const first = reminders[0]?.orgId
  return reminders.every((r) => r.orgId === first) ? first : undefined
}
