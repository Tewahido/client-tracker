// Supabase Edge Function (Deno): sends the daily reminders by Web Push. The logic is in
// handler.ts. This file is the source: `npm run build:functions` bundles it, with the app's
// reminder rules from src/lib, into index.ts, which is what gets deployed. See
// supabase/functions/README.md for the secrets and the daily schedule.
// Pinned to the versions the app is tested with (keep in step with package.json).
import { createClient } from 'npm:@supabase/supabase-js@2.118.0'
import { buildPushPayload } from 'npm:@block65/webcrypto-web-push@2.0.0'
import { toBorrower, toLoan, toPayment, type BorrowerRow, type LoanRow, type PaymentRow } from '../../../src/services/storage/supabaseRepository.ts'
import { classifyPushStatus, handleSendReminders, type Device, type Ledger } from './handler.ts'

const env = (name: string) => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not set`)
  return value
}

// Reads every organisation's data for the people being reminded, so it needs the service
// role; it only ever reads ledgers of organisations those people belong to.
const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })
const vapid = { subject: env('VAPID_SUBJECT'), publicKey: env('VAPID_PUBLIC_KEY'), privateKey: env('VAPID_PRIVATE_KEY') }
const secret = env('CRON_SECRET')

const PAGE = 1000

/** All rows, a page at a time (the API returns at most 1000 per request). */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) return rows
  }
}

type WithOrg<T> = T & { org_id: string }

Deno.serve((req) =>
  handleSendReminders(
    req,
    {
      async devices() {
        const rows = await all<{ endpoint: string; user_id: string; p256dh: string; auth: string; reminder_days: number; updated_at: string }>((from, to) =>
          db.from('push_subscriptions').select('endpoint, user_id, p256dh, auth, reminder_days, updated_at').order('endpoint').range(from, to),
        )
        return rows.map(
          (r): Device => ({ endpoint: r.endpoint, userId: r.user_id, p256dh: r.p256dh, auth: r.auth, reminderDays: r.reminder_days, savedAt: r.updated_at }),
        )
      },

      async ledgers(userIds) {
        const members = await all<{ org_id: string; user_id: string }>((from, to) =>
          db.from('organization_members').select('org_id, user_id').in('user_id', userIds).order('org_id').order('user_id').range(from, to),
        )
        const orgIds = [...new Set(members.map((m) => m.org_id))]
        if (orgIds.length === 0) return []
        const [orgs, borrowers, loans, payments] = await Promise.all([
          all<{ id: string; currency: string }>((from, to) => db.from('organizations').select('id, currency').in('id', orgIds).order('id').range(from, to)),
          all<WithOrg<BorrowerRow>>((from, to) => db.from('borrowers').select('*').in('org_id', orgIds).order('id').range(from, to)),
          all<WithOrg<LoanRow>>((from, to) => db.from('loans').select('*').in('org_id', orgIds).order('id').range(from, to)),
          all<WithOrg<PaymentRow>>((from, to) => db.from('payments').select('*').in('org_id', orgIds).order('id').range(from, to)),
        ])
        return orgs.map(
          (org): Ledger => ({
            orgId: org.id,
            currency: org.currency,
            memberIds: members.filter((m) => m.org_id === org.id).map((m) => m.user_id),
            borrowers: borrowers.filter((r) => r.org_id === org.id).map(toBorrower),
            loans: loans.filter((r) => r.org_id === org.id).map(toLoan),
            payments: payments.filter((r) => r.org_id === org.id).map(toPayment),
          }),
        )
      },

      async alreadySent(userIds, since) {
        // Older entries can't matter any more (see SENT_LOG_DAYS): prune them as we go.
        await db.from('push_reminder_log').delete().lt('sent_at', since.toISOString())
        // Ordered by the full primary key: paging needs a stable order, and keys repeat across people.
        const rows = await all<{ user_id: string; reminder_key: string }>((from, to) =>
          db
            .from('push_reminder_log')
            .select('user_id, reminder_key')
            .in('user_id', userIds)
            .gte('sent_at', since.toISOString())
            .order('user_id')
            .order('reminder_key')
            .range(from, to),
        )
        return rows.map((r) => ({ userId: r.user_id, key: r.reminder_key }))
      },

      async markSent(rows) {
        const { error } = await db
          .from('push_reminder_log')
          .upsert(rows.map((r) => ({ user_id: r.userId, reminder_key: r.key })), { ignoreDuplicates: true })
        if (error) throw new Error(error.message)
      },

      async push(device, notification) {
        const payload = await buildPushPayload(
          // Reminders stay useful for a day; after that tomorrow's run sends fresh ones.
          { data: { ...notification }, options: { ttl: 24 * 60 * 60, urgency: 'normal' } },
          { endpoint: device.endpoint, expirationTime: null, keys: { p256dh: device.p256dh, auth: device.auth } },
          vapid,
        )
        // A push service answers in well under a second; never let one address stall the run,
        // and never follow it elsewhere.
        const res = await fetch(device.endpoint, { ...payload, signal: AbortSignal.timeout(10_000), redirect: 'manual' })
        const result = classifyPushStatus(res.status)
        if (result === 'failed') console.error('send-reminders: push refused', res.status, (await res.text().catch(() => '')).slice(0, 200))
        return result
      },

      async forget(endpoint) {
        const { error } = await db.from('push_subscriptions').delete().eq('endpoint', endpoint)
        if (error) throw new Error(error.message)
      },

      log: (message, detail) => console.log(message, detail ?? ''),
    },
    { secret, now: new Date() },
  ),
)
