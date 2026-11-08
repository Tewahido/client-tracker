import { describe, expect, it } from 'vitest'
import { buildLoanViews } from './loans'
import { dueReminders, planNotifications, reminderStage, type Reminder } from './reminders'
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
    instalmentCount: null,
    firstDueOn: null,
    agreedTotalCents: null,
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

  it('reminds about each monthly instalment separately, with what is due now', () => {
    const monthly = { ...loan('plan', '2027-03-01'), firstDueOn: '2026-10-01', instalmentCount: 6, agreedTotalCents: 60_000 }
    const [reminder] = dueReminders(buildLoanViews([monthly], [], [borrower], '2026-10-04', 3), 3, (c) => `R${c / 100}`)
    expect(reminder.key).toBe('plan:2026-10-01:overdue-3')
    expect(reminder.body).toBe('R100 due now, R600 still owed in total. Tap to open the loan.')
  })
})

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
