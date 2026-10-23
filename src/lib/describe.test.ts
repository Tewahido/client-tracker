import { describe, expect, it } from 'vitest'
import { dueLabel, instalmentHistoryLabel, periodLabel, planProgressLabel } from './describe'
import { buildSchedule, planProgress } from './instalments'
import type { LoanView } from './loans'

const base = { nextDueOn: '2026-12-25', settledOn: null } as unknown as LoanView

describe('dueLabel', () => {
  it.each([
    [{ status: 'overdue', daysUntilDue: -1 }, 'Overdue by 1 day'],
    [{ status: 'overdue', daysUntilDue: -4 }, 'Overdue by 4 days'],
    [{ status: 'due-today', daysUntilDue: 0 }, 'Due today'],
    [{ status: 'due-soon', daysUntilDue: 1 }, 'Due tomorrow'],
    [{ status: 'active', daysUntilDue: 12 }, 'Due in 12 days'],
    [{ status: 'active', daysUntilDue: 68 }, 'Due 25 Dec 2026'],
    [{ status: 'written-off', daysUntilDue: 3 }, 'Forgiven'],
    [{ status: 'paid', daysUntilDue: 3, settledOn: '2026-10-02' }, 'Paid off 2 Oct'],
  ] as const)('%j -> %s', (patch, expected) => {
    expect(dueLabel({ ...base, ...patch })).toBe(expected)
  })
})

describe('periodLabel', () => {
  it.each([
    [7, '1 week'],
    [14, '2 weeks'],
    [30, '1 month'],
    [90, '3 months'],
    [365, '1 year'],
    [45, '45 days'],
    [1, '1 day'],
  ])('%i -> %s', (days, label) => {
    expect(periodLabel(days)).toBe(label)
  })
})

describe('planProgressLabel', () => {
  const schedule = buildSchedule('2026-07-01', 12, 2_400_000)

  it('counts paid instalments, late ones included', () => {
    const payments = [{ id: 'p', loanId: 'l', amountCents: 600_000, paidOn: '2026-09-20', note: null, createdAt: '' }]
    expect(planProgressLabel(planProgress(schedule, payments, '2026-09-25'))).toBe('3 of 12 paid')
  })

  it('adds the missed ones', () => {
    expect(planProgressLabel(planProgress(schedule, [], '2026-08-15'))).toBe('0 of 12 paid · 2 missed')
  })
})

describe('instalmentHistoryLabel', () => {
  it.each([
    [0, 0, null],
    [1, 0, '1 missed instalment'],
    [2, 1, '2 missed instalments · 1 paid late'],
    [0, 3, '3 paid late'],
  ])('%i missed, %i late -> %s', (missed, late, expected) => {
    expect(instalmentHistoryLabel(missed, late)).toBe(expected)
  })
})
