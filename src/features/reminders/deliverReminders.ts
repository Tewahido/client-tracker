import type { Reminder } from '../../lib/reminders'

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
        body: reminders
          .slice(0, 3)
          .map((r) => r.title)
          .join('\n'),
        tag: 'lendly-summary',
        url: '#loans?status=open',
        keys: reminders.map((r) => r.key),
      },
    ]
  }
  return reminders.map((r) => ({ title: r.title, body: r.body, tag: r.key, url: `#loans?open=${r.loanId}`, keys: [r.key] }))
}

/**
 * Send the planned notifications and return the reminder keys that were really shown,
 * so a reminder that failed (permission revoked, browser refused) is retried next time.
 */
export async function deliverReminders(reminders: Reminder[], show: (n: OutgoingNotification) => Promise<boolean>): Promise<string[]> {
  const outgoing = planNotifications(reminders)
  const results = await Promise.allSettled(outgoing.map(show))
  return outgoing.flatMap((n, i) => {
    const result = results[i]
    return result.status === 'fulfilled' && result.value ? n.keys : []
  })
}
