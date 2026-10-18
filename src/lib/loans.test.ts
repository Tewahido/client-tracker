import { describe, expect, it } from 'vitest'
import { borrowerStats, buildLoanViews, loanStatus, monthlyCollections, portfolioStats, sortByUrgency, totalDueCents } from './loans'
import type { Borrower, Loan, Payment } from './types'

const TODAY = '2026-10-18'

const borrower: Borrower = { id: 'b1', name: 'Abel', phone: null, email: null, notes: null, createdAt: '' }

function loan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 'l1',
    borrowerId: 'b1',
    principalCents: 10_000,
    interestRate: 0,
    lentOn: '2026-10-01',
    dueOn: '2026-11-01',
    note: null,
    writtenOffOn: null,
    createdAt: '',
    ...overrides,
  }
}

function payment(overrides: Partial<Payment> = {}): Payment {
  return { id: crypto.randomUUID(), loanId: 'l1', amountCents: 0, paidOn: TODAY, note: null, createdAt: '', ...overrides }
}

describe('totalDueCents', () => {
  it('adds flat interest and rounds to whole cents', () => {
    expect(totalDueCents({ principalCents: 10_000, interestRate: 0 })).toBe(10_000)
    expect(totalDueCents({ principalCents: 10_000, interestRate: 15 })).toBe(11_500)
    expect(totalDueCents({ principalCents: 333, interestRate: 10 })).toBe(366)
  })
})

describe('loanStatus', () => {
  it.each([
    [0, -5, 3, false, 'paid'],
    [100, 10, 3, true, 'written-off'],
    [100, -1, 3, false, 'overdue'],
    [100, 0, 3, false, 'due-today'],
    [100, 3, 3, false, 'due-soon'],
    [100, 4, 3, false, 'active'],
  ] as const)('balance %i, %i days left, soon=%i, writtenOff=%s -> %s', (balance, days, soon, off, expected) => {
    expect(loanStatus(balance, days, soon, off)).toBe(expected)
  })
})

describe('buildLoanViews', () => {
  it('computes balance, progress and status from payments', () => {
    const [view] = buildLoanViews([loan()], [payment({ amountCents: 2_500 })], [borrower], TODAY, 3)
    expect(view.paidCents).toBe(2_500)
    expect(view.balanceCents).toBe(7_500)
    expect(view.progress).toBe(0.25)
    expect(view.status).toBe('active')
    expect(view.daysUntilDue).toBe(14)
    expect(view.borrower).toBe(borrower)
    expect(view.settledOn).toBeNull()
  })

  it('never reports a negative balance on overpayment and records the settle date', () => {
    const payments = [payment({ amountCents: 6_000, paidOn: '2026-10-05' }), payment({ amountCents: 6_000, paidOn: '2026-10-10' })]
    const [view] = buildLoanViews([loan()], payments, [borrower], TODAY, 3)
    expect(view.balanceCents).toBe(0)
    expect(view.progress).toBe(1)
    expect(view.status).toBe('paid')
    expect(view.settledOn).toBe('2026-10-10')
  })

  it('marks loans past their due date as overdue', () => {
    const [view] = buildLoanViews([loan({ dueOn: '2026-10-15' })], [], [borrower], TODAY, 3)
    expect(view.status).toBe('overdue')
    expect(view.daysUntilDue).toBe(-3)
  })
})

describe('sortByUrgency', () => {
  it('puts overdue first, then by nearest due date', () => {
    const loans = [
      loan({ id: 'a', dueOn: '2026-12-01' }),
      loan({ id: 'b', dueOn: '2026-10-10' }),
      loan({ id: 'c', dueOn: '2026-10-20' }),
      loan({ id: 'd', dueOn: '2026-10-25' }),
    ]
    const views = buildLoanViews(loans, [], [borrower], TODAY, 3)
    expect(sortByUrgency(views).map((v) => v.loan.id)).toEqual(['b', 'c', 'd', 'a'])
  })
})

describe('portfolioStats', () => {
  it('aggregates open balances and this month collections', () => {
    const loans = [loan({ id: 'over', dueOn: '2026-10-01' }), loan({ id: 'week', dueOn: '2026-10-22' }), loan({ id: 'done' })]
    const payments = [
      payment({ loanId: 'done', amountCents: 10_000, paidOn: '2026-10-02' }),
      payment({ loanId: 'week', amountCents: 1_000, paidOn: '2026-09-30' }),
    ]
    const views = buildLoanViews(loans, payments, [borrower], TODAY, 3)
    const stats = portfolioStats(views, payments, TODAY)
    expect(stats.outstandingCents).toBe(19_000)
    expect(stats.overdueCount).toBe(1)
    expect(stats.overdueCents).toBe(10_000)
    expect(stats.dueThisWeekCount).toBe(1)
    expect(stats.dueThisWeekCents).toBe(9_000)
    expect(stats.collectedThisMonthCents).toBe(10_000)
    expect(stats.totalCollectedCents).toBe(11_000)
    expect(stats.openCount).toBe(2)
    expect(stats.borrowersWithDebt).toBe(1)
  })
})

describe('borrowerStats', () => {
  it('scores on-time repayment over settled loans only', () => {
    const loans = [
      loan({ id: 'early', dueOn: '2026-10-10' }),
      loan({ id: 'late', dueOn: '2026-10-01' }),
      loan({ id: 'open', dueOn: '2026-11-30' }),
    ]
    const payments = [
      payment({ loanId: 'early', amountCents: 10_000, paidOn: '2026-10-09' }),
      payment({ loanId: 'late', amountCents: 10_000, paidOn: '2026-10-05' }),
    ]
    const stats = borrowerStats(buildLoanViews(loans, payments, [borrower], TODAY, 3))
    expect(stats.settledLoans).toBe(2)
    expect(stats.onTimeRate).toBe(0.5)
    expect(stats.openLoans).toBe(1)
    expect(stats.nextDue?.loan.id).toBe('open')
  })
})

describe('monthlyCollections', () => {
  it('buckets payments into the trailing months', () => {
    const buckets = monthlyCollections(
      [payment({ amountCents: 100, paidOn: '2026-10-01' }), payment({ amountCents: 50, paidOn: '2026-08-31' }), payment({ amountCents: 999, paidOn: '2025-01-01' })],
      TODAY,
      3,
    )
    expect(buckets).toEqual([
      { key: '2026-08', cents: 50 },
      { key: '2026-09', cents: 0 },
      { key: '2026-10', cents: 100 },
    ])
  })
})
