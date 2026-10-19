import { describe, expect, it } from 'vitest'
import { previewLoan, tryItProblem } from './loanPreview'

describe('previewLoan', () => {
  it('adds flat interest and works out the due and reminder dates', () => {
    expect(previewLoan({ principalCents: 150_000, interestRate: 10, termDays: 30, lentOn: '2026-10-19' })).toEqual({
      totalDueCents: 165_000,
      interestCents: 15_000,
      dueOn: '2026-11-18',
      firstReminderOn: '2026-11-15',
    })
  })

  it('handles interest-free loans', () => {
    const preview = previewLoan({ principalCents: 50_000, interestRate: 0, termDays: 14, lentOn: '2026-10-19' })
    expect(preview.totalDueCents).toBe(50_000)
    expect(preview.interestCents).toBe(0)
  })

  it('never reminds before the loan was made, even for very short loans', () => {
    expect(previewLoan({ principalCents: 10_000, interestRate: 0, termDays: 1, lentOn: '2026-10-19' }).firstReminderOn).toBe('2026-10-19')
  })
})

describe('tryItProblem', () => {
  it.each([
    [null, 10, 'Enter how much you lent.'],
    [0, 10, 'Enter how much you lent.'],
    [1_000_000_001, 10, 'Try an amount up to 10 million.'],
    [150_000, -1, 'Interest can be anything from 0% to 100%.'],
    [150_000, 101, 'Interest can be anything from 0% to 100%.'],
    [150_000, Number.NaN, 'Interest can be anything from 0% to 100%.'],
    [150_000, 0, null],
    [1_000_000_000, 100, null],
  ])('amount %s, interest %s -> %s', (cents, rate, expected) => {
    expect(tryItProblem(cents, rate)).toBe(expected)
  })
})
