import { planNotifications, type OutgoingNotification, type Reminder } from '../../lib/reminders'

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
