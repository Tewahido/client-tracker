import { describe, expect, it, vi } from 'vitest'
import type { Reminder } from '../../lib/reminders'
import { deliverReminders } from './deliverReminders'

const reminder = (n: number): Reminder => ({ key: `k${n}`, loanId: `l${n}`, stage: 'today', title: `Title ${n}`, body: `Body ${n}` })

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
