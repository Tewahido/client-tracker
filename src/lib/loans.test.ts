import { describe, expect, it } from 'vitest'
import {
  amountDueNowCents,
  attentionList,
  borrowerStats,
  buildLoanViews,
  extendedDueDate,
  loanStatus,
  monthlyCollections,
  needsAttention,
  outstandingCents,
  portfolioStats,
  sortByUrgency,
  totalDueCents,
} from './loans'
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
    instalmentCount: null,
    firstDueOn: null,
    agreedTotalCents: null,
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

describe('attention helpers', () => {
  const views = buildLoanViews(
    [
      loan({ id: 'late', dueOn: '2026-10-10' }),
      loan({ id: 'today', dueOn: '2026-10-18' }),
      loan({ id: 'soon', dueOn: '2026-10-20' }),
      loan({ id: 'later', dueOn: '2026-12-01' }),
      loan({ id: 'paid', dueOn: '2026-10-01' }),
      loan({ id: 'forgiven', dueOn: '2026-10-01', writtenOffOn: '2026-10-05' }),
    ],
    [payment({ loanId: 'paid', amountCents: 10_000 }), payment({ loanId: 'late', amountCents: 2_500 })],
    [borrower],
    TODAY,
    3,
  )

  it('lists overdue, due-today and due-soon loans, most urgent first', () => {
    expect(attentionList(views).map((v) => v.loan.id)).toEqual(['late', 'today', 'soon'])
    expect(needsAttention('active')).toBe(false)
    expect(needsAttention('paid')).toBe(false)
  })

  it('sums what is still owed on open loans only', () => {
    // late 7,500 + today 10,000 + soon 10,000 + later 10,000; paid and forgiven excluded
    expect(outstandingCents(views)).toBe(37_500)
  })
})

describe('monthly plans', () => {
  // TODAY is 18 Oct. R20,000 lent for R2,000 a month over 12 months from 1 Sep.
  const planned = (overrides: Partial<Loan> = {}) =>
    loan({
      principalCents: 2_000_000,
      interestRate: 20,
      lentOn: '2026-08-01',
      firstDueOn: '2026-09-01',
      dueOn: '2027-08-01',
      instalmentCount: 12,
      agreedTotalCents: 2_400_000,
      ...overrides,
    })
  const view = (payments: Payment[], overrides: Partial<Loan> = {}) => buildLoanViews([planned(overrides)], payments, [borrower], TODAY, 3)[0]

  it('uses the agreed total over the interest rate', () => {
    expect(totalDueCents({ principalCents: 1_750_000, interestRate: 37.14, agreedTotalCents: 2_400_000 })).toBe(2_400_000)
    expect(view([]).totalDueCents).toBe(2_400_000)
  })

  it('is due when the oldest unpaid instalment is, not at the end of the plan', () => {
    const v = view([payment({ amountCents: 200_000, paidOn: '2026-09-01' })])
    expect(v.nextDueOn).toBe('2026-10-01')
    expect(v.status).toBe('overdue')
    expect(v.daysUntilDue).toBe(-17)
    expect(v.plan).toMatchObject({ missedCount: 1, arrearsCents: 200_000 })
  })

  it('is on track while the instalments are paid', () => {
    const v = view([payment({ amountCents: 400_000, paidOn: '2026-09-30' })])
    expect(v.nextDueOn).toBe('2026-11-01')
    expect(v.status).toBe('active')
    expect(amountDueNowCents(v)).toBe(200_000)
  })

  it('asks for the missed instalments first', () => {
    expect(amountDueNowCents(view([]))).toBe(400_000)
    expect(amountDueNowCents(buildLoanViews([loan()], [], [borrower], TODAY, 3)[0])).toBe(10_000)
  })

  it('tells how many instalments a person missed or paid late', () => {
    const stats = borrowerStats([
      view([payment({ amountCents: 200_000, paidOn: '2026-09-05' })]),
      view([], { id: 'l2' }),
      buildLoanViews([loan({ id: 'l3' })], [], [borrower], TODAY, 3)[0],
    ])
    expect(stats).toMatchObject({ missedInstalments: 3, lateInstalments: 1 })
  })

  it('sorts by the next instalment', () => {
    const later = view([payment({ loanId: 'later', amountCents: 400_000 })], { id: 'later' })
    const sooner = buildLoanViews([loan({ id: 'sooner', dueOn: '2026-10-25' })], [], [borrower], TODAY, 3)[0]
    expect(sortByUrgency([later, sooner]).map((v) => v.loan.id)).toEqual(['sooner', 'later'])
  })
})

describe('extendedDueDate', () => {
  it('counts from the due date, or from today when it is already late', () => {
    const [onTime] = buildLoanViews([loan({ dueOn: '2026-10-20' })], [], [borrower], TODAY, 3)
    expect(extendedDueDate(onTime, 7, TODAY)).toBe('2026-10-27')
    const [late] = buildLoanViews([loan({ dueOn: '2026-10-10' })], [], [borrower], TODAY, 3)
    expect(extendedDueDate(late, 7, TODAY)).toBe('2026-10-25')
  })
})

describe('portfolioStats with monthly plans', () => {
  it('counts only what is behind as overdue, and the next instalment as due this week', () => {
    const plan = { principalCents: 600_000, lentOn: '2026-07-01', instalmentCount: 6, agreedTotalCents: 600_000 }
    const views = buildLoanViews(
      [
        // R1,000 a month from 1 Aug: Aug, Sep and Oct missed.
        loan({ id: 'behind', ...plan, firstDueOn: '2026-08-01', dueOn: '2027-01-01' }),
        // Next instalment on 20 Oct.
        loan({ id: 'soon', ...plan, firstDueOn: '2026-10-20', dueOn: '2027-03-20' }),
      ],
      [],
      [borrower],
      TODAY,
      3,
    )
    const stats = portfolioStats(views, [], TODAY)
    expect(stats).toMatchObject({ overdueCents: 300_000, overdueCount: 1, dueThisWeekCents: 100_000, dueThisWeekCount: 1, outstandingCents: 1_200_000 })
  })
})
