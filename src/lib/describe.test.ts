import { describe, expect, it } from 'vitest'
import { dueLabel } from './describe'
import type { LoanView } from './loans'

const base = { loan: { dueOn: '2026-12-25' }, settledOn: null } as unknown as LoanView

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
