import { describe, expect, it, vi } from 'vitest'
import type { Borrower, Loan } from '../../../src/lib/types'
import { classifyPushStatus, handleSendReminders, type Device, type Ledger, type SendRemindersDeps } from './handler'

const SECRET = 'cron-secret-for-tests'
// 06:00 UTC = 08:00 in Johannesburg, when the daily job runs.
const NOW = new Date('2026-11-08T06:00:00Z')

const borrower = (id: string, name: string): Borrower => ({ id, name, phone: null, email: null, notes: null, createdAt: '2026-10-01T00:00:00Z' })
const loan = (id: string, borrowerId: string, dueOn: string): Loan => ({
  id,
  borrowerId,
  principalCents: 150_000,
  interestRate: 0,
  lentOn: '2026-10-01',
  dueOn,
  note: null,
  writtenOffOn: null,
  instalmentCount: null,
  firstDueOn: null,
  agreedTotalCents: null,
  createdAt: '2026-10-01T00:00:00Z',
})
const device = (userId: string, n = 1, reminderDays = 3): Device => ({
  endpoint: `https://web.push.apple.com/${userId}-${n}`,
  userId,
  p256dh: 'p256dh',
  auth: 'auth',
  reminderDays,
  savedAt: '2026-11-01T00:00:00Z',
})
const ledger = (orgId: string, memberIds: string[], loans: Loan[], borrowers = [borrower('b1', 'Sipho')]): Ledger => ({
  orgId,
  currency: 'ZAR',
  memberIds,
  borrowers,
  loans,
  payments: [],
})

function deps(devices: Device[], ledgers: Ledger[], overrides: Partial<SendRemindersDeps> = {}) {
  const sent: Array<{ userId: string; key: string }> = []
  return {
    sent,
    devices: vi.fn(async () => devices),
    ledgers: vi.fn(async (userIds: string[]) => ledgers.filter((l) => l.memberIds.some((m) => userIds.includes(m)))),
    alreadySent: vi.fn(async () => [...sent]),
    markSent: vi.fn(async (rows: Array<{ userId: string; key: string }>) => {
      sent.push(...rows)
    }),
    push: vi.fn(async (): Promise<'sent' | 'gone' | 'failed'> => 'sent'),
    forget: vi.fn(async () => {}),
    ...overrides,
  }
}

const run = (d: SendRemindersDeps, init: RequestInit = { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } }) =>
  handleSendReminders(new Request('https://example.supabase.co/functions/v1/send-reminders', init), d, { secret: SECRET, now: NOW })

describe('send-reminders', () => {
  it('only runs for the scheduler, which knows the secret', async () => {
    const d = deps([device('u1')], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')])])
    expect((await run(d, { method: 'POST' })).status).toBe(401)
    expect((await run(d, { method: 'POST', headers: { Authorization: 'Bearer wrong' } })).status).toBe(401)
    expect((await run(d, { method: 'GET', headers: { Authorization: `Bearer ${SECRET}` } })).status).toBe(405)
    expect(d.devices).not.toHaveBeenCalled()
  })

  it('refuses to run with no secret configured', async () => {
    const d = deps([], [])
    const res = await handleSendReminders(new Request('https://x/send-reminders', { method: 'POST', headers: { Authorization: 'Bearer ' } }), d, {
      secret: '',
      now: NOW,
    })
    expect(res.status).toBe(401)
  })

  it('sends a due reminder to each of the person’s devices, then remembers it was sent', async () => {
    const d = deps([device('u1', 1), device('u1', 2)], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')])])
    const res = await run(d)

    expect(res.status).toBe(200)
    expect(d.push).toHaveBeenCalledTimes(2)
    expect(d.push).toHaveBeenCalledWith(device('u1', 1), {
      title: "Sipho's payment is due today",
      // Number formatting follows the server's locale ("R1,500.00" or "R 1 500,00").
      body: expect.stringMatching(/^R.*still owed\.$/),
      tag: 'l1:2026-11-08:today',
      url: '#loans?open=l1&org=org1',
    })
    expect(d.sent).toEqual([{ userId: 'u1', key: 'l1:2026-11-08:today' }])
    expect(await res.json()).toEqual({ people: 1, notifications: 2, delivered: 2, removed: 0 })
    // Only the last 45 days of the sent log can matter.
    expect(d.alreadySent).toHaveBeenCalledWith(['u1'], new Date('2026-09-24T06:00:00Z'))
  })

  it('does not send the same reminder twice', async () => {
    const d = deps([device('u1')], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')])])
    await run(d)
    await run(d)
    expect(d.push).toHaveBeenCalledTimes(1)
  })

  it('only reminds people about organisations they belong to', async () => {
    const d = deps(
      [device('u1'), device('u2')],
      [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')]), ledger('org2', ['u2'], [loan('l2', 'b1', '2026-11-30')])],
    )
    await run(d)
    // u2's loan is due in 22 days: nothing yet. u1 never hears about org2.
    expect(vi.mocked(d.push).mock.calls.map(([dev]) => dev.userId)).toEqual(['u1'])
  })

  it('uses the widest reminder window the person picked on any device', async () => {
    const d = deps([device('u1', 1, 3), device('u1', 2, 5)], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-13')])])
    await run(d)
    expect(vi.mocked(d.push).mock.calls[0][1].title).toBe("Sipho's payment is due in 5 days")
  })

  it('works out "today" in South African time', async () => {
    const d = deps([device('u1')], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')])])
    // 23:30 UTC on 7 Nov is already 8 Nov in Johannesburg.
    await handleSendReminders(new Request('https://x/send-reminders', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}` } }), d, {
      secret: SECRET,
      now: new Date('2026-11-07T23:30:00Z'),
    })
    expect(vi.mocked(d.push).mock.calls[0][1].title).toBe("Sipho's payment is due today")
  })

  it('sums up more than three reminders in one notification', async () => {
    const loans = [1, 2, 3, 4].map((n) => loan(`l${n}`, 'b1', '2026-11-08'))
    const d = deps([device('u1')], [ledger('org1', ['u1'], loans)])
    await run(d)
    expect(d.push).toHaveBeenCalledTimes(1)
    expect(vi.mocked(d.push).mock.calls[0][1].title).toBe('4 loans need your attention')
    expect(d.sent).toHaveLength(4)
  })

  it('forgets devices the push service says are gone, and retries what nothing delivered', async () => {
    const pushes: Record<string, 'sent' | 'gone' | 'failed'> = { 'https://web.push.apple.com/u1-1': 'gone', 'https://web.push.apple.com/u1-2': 'failed' }
    const d = deps([device('u1', 1), device('u1', 2)], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')])], {
      push: vi.fn(async (dev: Device) => pushes[dev.endpoint]),
    })
    const res = await run(d)

    expect(d.forget).toHaveBeenCalledWith('https://web.push.apple.com/u1-1')
    expect(d.forget).toHaveBeenCalledTimes(1)
    expect(d.sent).toEqual([])
    expect(await res.json()).toEqual({ people: 1, notifications: 2, delivered: 0, removed: 1 })
  })

  it('keeps going for everyone else when one person’s reminders fail', async () => {
    const d = deps(
      [device('u1'), device('u2')],
      [ledger('org1', ['u1', 'u2'], [loan('l1', 'b1', '2026-11-08')])],
      {
        push: vi.fn(async (dev: Device) => {
          if (dev.userId === 'u1') throw new Error('network down')
          return 'sent' as const
        }),
      },
    )
    const res = await run(d)
    expect(res.status).toBe(200)
    expect(d.sent).toEqual([{ userId: 'u2', key: 'l1:2026-11-08:today' }])
  })

  // Lendly re-saves a device whenever it's opened there. One unopened for months is likely lost
  // or sold, and its lock screen would keep showing borrowers and amounts.
  it('forgets devices nobody has opened Lendly on for 90 days', async () => {
    const old = { ...device('u1', 1), savedAt: '2026-08-01T00:00:00Z' }
    const d = deps([old, device('u1', 2)], [ledger('org1', ['u1'], [loan('l1', 'b1', '2026-11-08')])])
    const res = await run(d)

    expect(d.forget).toHaveBeenCalledWith(old.endpoint)
    expect(vi.mocked(d.push).mock.calls.map(([dev]) => dev.endpoint)).toEqual([device('u1', 2).endpoint])
    expect(await res.json()).toEqual({ people: 1, notifications: 1, delivered: 1, removed: 1 })
  })

  it('works through people in batches, so a growing app stays within request limits', async () => {
    const people = Array.from({ length: 250 }, (_, i) => `u${i}`)
    const d = deps(people.map((u) => device(u)), [ledger('org1', people, [loan('l1', 'b1', '2026-11-08')])])
    const res = await run(d)

    const batches = vi.mocked(d.ledgers).mock.calls.map(([ids]) => ids.length)
    expect(batches).toEqual([100, 100, 50])
    expect((await res.json()).delivered).toBe(250)
  })

  it('has nothing to do when nobody turned reminders on', async () => {
    const d = deps([], [])
    expect(await (await run(d)).json()).toEqual({ people: 0, notifications: 0, delivered: 0, removed: 0 })
    expect(d.ledgers).not.toHaveBeenCalled()
  })
})

describe('classifyPushStatus', () => {
  it('reads the push service’s answer', () => {
    expect(classifyPushStatus(201)).toBe('sent')
    expect(classifyPushStatus(200)).toBe('sent')
    // The device unsubscribed or the app was removed: stop sending to it.
    expect(classifyPushStatus(404)).toBe('gone')
    expect(classifyPushStatus(410)).toBe('gone')
    expect(classifyPushStatus(429)).toBe('failed')
    expect(classifyPushStatus(500)).toBe('failed')
  })
})
