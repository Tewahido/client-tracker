import { describe, expect, it } from 'vitest'
import { buildLoanViews } from './loans'
import { dueReminders, reminderStage } from './reminders'
import type { Borrower, Loan } from './types'

describe('reminderStage', () => {
  it.each([
    [10, null],
    [3, 'soon'],
    [1, 'tomorrow'],
    [0, 'today'],
    [-1, 'overdue-1'],
    [-2, 'overdue-1'],
    [-3, 'overdue-3'],
    [-7, 'overdue-7'],
    [-13, 'overdue-7'],
    [-14, 'overdue-w2'],
    [-22, 'overdue-w3'],
  ])('%i days -> %s', (days, stage) => {
    expect(reminderStage(days, 3)).toBe(stage)
  })
})

describe('dueReminders', () => {
  const borrower: Borrower = { id: 'b', name: 'Thandi Nkosi', phone: null, email: null, notes: null, createdAt: '' }
  const loan = (id: string, dueOn: string): Loan => ({
    id,
    borrowerId: 'b',
    principalCents: 50_000,
    interestRate: 0,
    lentOn: '2026-09-01',
    dueOn,
    note: null,
    writtenOffOn: null,
    createdAt: '',
  })

  it('only includes open loans inside the reminder window, keyed by due date and stage', () => {
    const views = buildLoanViews(
      [loan('late', '2026-10-15'), loan('later', '2026-12-01'), loan('paid', '2026-10-10')],
      [{ id: 'p', loanId: 'paid', amountCents: 50_000, paidOn: '2026-10-09', note: null, createdAt: '' }],
      [borrower],
      '2026-10-18',
      3,
    )
    const reminders = dueReminders(views, 3, (c) => `R${c / 100}`)
    expect(reminders).toHaveLength(1)
    expect(reminders[0]).toMatchObject({
      key: 'late:2026-10-15:overdue-3',
      title: 'Thandi Nkosi is 3 days overdue',
    })
    expect(reminders[0].body).toContain('R500')
  })
})
