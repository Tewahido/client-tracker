import { describe, expect, it } from 'vitest'
import { previewLoan } from './loanPreview'

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
