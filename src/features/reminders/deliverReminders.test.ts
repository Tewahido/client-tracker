import { describe, expect, it, vi } from 'vitest'
import type { Reminder } from '../../lib/reminders'
import { deliverReminders, planNotifications } from './deliverReminders'

const reminder = (n: number): Reminder => ({ key: `k${n}`, loanId: `l${n}`, stage: 'today', title: `Title ${n}`, body: `Body ${n}` })

describe('planNotifications', () => {
  it('sends up to three reminders individually, linking to each loan', () => {
    const plan = planNotifications([reminder(1), reminder(2)])
    expect(plan.map((n) => n.url)).toEqual(['#loans?open=l1', '#loans?open=l2'])
  })

  it('summarises more than three into one notification covering every key', () => {
    const plan = planNotifications([1, 2, 3, 4].map(reminder))
    expect(plan).toHaveLength(1)
    expect(plan[0].title).toBe('4 loans need your attention')
    expect(plan[0].keys).toEqual(['k1', 'k2', 'k3', 'k4'])
  })
})

describe('deliverReminders', () => {
  it('returns only the keys of notifications that were really shown', async () => {
    const show = vi.fn(async (n: { tag: string }) => {
      if (n.tag === 'k2') throw new Error('Illegal constructor')
      return n.tag !== 'k3'
    })
    expect(await deliverReminders([reminder(1), reminder(2), reminder(3)], show)).toEqual(['k1'])
  })

  it('logs every key behind a summary once it is shown', async () => {
    expect(await deliverReminders([1, 2, 3, 4].map(reminder), async () => true)).toEqual(['k1', 'k2', 'k3', 'k4'])
  })
})
