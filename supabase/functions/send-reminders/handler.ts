/**
 * The send-reminders Edge Function's logic, kept free of Deno APIs so Vitest can test it.
 * main.ts wires it to Supabase and the push services; scripts/build-functions.mjs bundles
 * them, with the app's own reminder rules, into index.ts for deployment.
 *
 * A scheduler (Supabase Cron) calls this once a day with a shared secret. For everyone who
 * turned on reminders on a device, it works out the same reminders the app shows, in every
 * organisation they belong to, skips the ones already sent, and pushes the rest to each of
 * their devices.
 */
import { todayIn } from '../../../src/lib/dates.ts'
import { buildLoanViews } from '../../../src/lib/loans.ts'
import { formatMoney } from '../../../src/lib/money.ts'
import { dueReminders, planNotifications, type Reminder } from '../../../src/lib/reminders.ts'
import type { Borrower, Loan, Payment } from '../../../src/lib/types.ts'

/** Lendly's lenders are in South Africa; the server runs in UTC. */
export const REMINDER_TIME_ZONE = 'Africa/Johannesburg'

/** A device that turned on reminders (a row of push_subscriptions). */
export interface Device {
  endpoint: string
  userId: string
  p256dh: string
  auth: string
  reminderDays: number
}

/** One organisation's loans, and which of the people being reminded belong to it. */
export interface Ledger {
  orgId: string
  currency: string
  memberIds: string[]
  borrowers: Borrower[]
  loans: Loan[]
  payments: Payment[]
}

/** What the service worker receives and shows (see src/sw.ts). */
export interface PushNotification {
  title: string
  body: string
  tag: string
  url: string
}

export type PushResult = 'sent' | 'gone' | 'failed'

export interface SendRemindersDeps {
  devices(): Promise<Device[]>
  /** Organisations any of these people belong to. */
  ledgers(userIds: string[]): Promise<Ledger[]>
  alreadySent(userIds: string[]): Promise<Array<{ userId: string; key: string }>>
  markSent(rows: Array<{ userId: string; key: string }>): Promise<void>
  push(device: Device, notification: PushNotification): Promise<PushResult>
  /** Removes a device the push service no longer knows. */
  forget(endpoint: string): Promise<void>
  /** Server-side log (Supabase › Edge Functions › Logs). */
  log?(message: string, detail?: unknown): void
}

/** How the push service answered: 404/410 mean the subscription is gone for good. */
export function classifyPushStatus(status: number): PushResult {
  if (status >= 200 && status < 300) return 'sent'
  if (status === 404 || status === 410) return 'gone'
  return 'failed'
}

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Compares without stopping at the first difference, so timing doesn't leak the secret. */
function sameSecret(given: string, expected: string): boolean {
  if (!expected || given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

/** Everything this person should be reminded of today, across their organisations. */
function remindersFor(userId: string, ledgers: Ledger[], soonDays: number, today: string): Reminder[] {
  return ledgers
    .filter((l) => l.memberIds.includes(userId))
    .flatMap((l) => {
      const views = buildLoanViews(l.loans, l.payments, l.borrowers, today, soonDays)
      return dueReminders(views, soonDays, (cents) => formatMoney(cents, l.currency)).map((r) => ({ ...r, orgId: l.orgId }))
    })
}

export async function handleSendReminders(
  req: Request,
  deps: SendRemindersDeps,
  options: { secret: string; now: Date },
): Promise<Response> {
  if (req.method !== 'POST') return reply(405, { error: 'Use POST' })
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  if (!sameSecret(token, options.secret)) return reply(401, { error: 'Not allowed' })

  const devices = await deps.devices()
  const byUser = new Map<string, Device[]>()
  for (const d of devices) byUser.set(d.userId, [...(byUser.get(d.userId) ?? []), d])
  const userIds = [...byUser.keys()]
  const summary = { people: userIds.length, notifications: 0, delivered: 0, removed: 0 }
  if (userIds.length === 0) return reply(200, summary)

  const [ledgers, sentRows] = await Promise.all([deps.ledgers(userIds), deps.alreadySent(userIds)])
  const sent = new Set(sentRows.map((r) => `${r.userId}|${r.key}`))
  const today = todayIn(REMINDER_TIME_ZONE, options.now)

  for (const [userId, userDevices] of byUser) {
    try {
      const soonDays = Math.max(...userDevices.map((d) => d.reminderDays))
      const fresh = remindersFor(userId, ledgers, soonDays, today).filter((r) => !sent.has(`${userId}|${r.key}`))

      const delivered: string[] = []
      for (const n of planNotifications(fresh)) {
        const notification = { title: n.title, body: n.body, tag: n.tag, url: n.url }
        const results = await Promise.all(userDevices.map((d) => deps.push(d, notification)))
        summary.notifications += results.length
        summary.delivered += results.filter((r) => r === 'sent').length
        // Logged once any of their devices got it; if none did, it's retried tomorrow.
        if (results.includes('sent')) delivered.push(...n.keys)

        for (const [i, result] of results.entries()) {
          if (result !== 'gone') continue
          await deps.forget(userDevices[i].endpoint)
          summary.removed++
        }
      }
      if (delivered.length > 0) await deps.markSent(delivered.map((key) => ({ userId, key })))
    } catch (err) {
      deps.log?.('send-reminders: failed for one person', err instanceof Error ? err.message : err)
    }
  }

  deps.log?.('send-reminders: done', summary)
  return reply(200, summary)
}
