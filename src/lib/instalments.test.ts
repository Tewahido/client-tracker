import { describe, expect, it } from 'vitest'
import { buildSchedule, hasPlan, lastInstalmentOn, planProgress, splitTotal } from './instalments'
import type { Payment } from './types'

const pay = (amountCents: number, paidOn: string): Payment => ({ id: paidOn + amountCents, loanId: 'l', amountCents, paidOn, note: null, createdAt: '' })

describe('splitTotal', () => {
  it('splits evenly when it can', () => {
    expect(splitTotal(2_400_000, 12)).toEqual({ regularCents: 200_000, lastCents: 200_000 })
  })

  it('puts the leftover cents on the last instalment', () => {
    expect(splitTotal(2_500_000, 12)).toEqual({ regularCents: 208_333, lastCents: 208_337 })
  })
})

describe('buildSchedule', () => {
  it('lists one payment a month from the first due date, adding up to the total', () => {
    const schedule = buildSchedule('2026-11-25', 3, 100_000)
    expect(schedule).toEqual([
      { number: 1, dueOn: '2026-11-25', amountCents: 33_333 },
      { number: 2, dueOn: '2026-12-25', amountCents: 33_333 },
      { number: 3, dueOn: '2027-01-25', amountCents: 33_334 },
    ])
  })

  it('clamps month ends without drifting off the original day', () => {
    expect(buildSchedule('2027-01-31', 3, 300).map((i) => i.dueOn)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31'])
    expect(lastInstalmentOn('2027-01-31', 3)).toBe('2027-03-31')
  })
})

describe('hasPlan', () => {
  it('is false for once-off loans, including ones saved before plans existed', () => {
    expect(hasPlan({ instalmentCount: null, firstDueOn: null })).toBe(false)
    expect(hasPlan({} as never)).toBe(false)
    expect(hasPlan({ instalmentCount: 12, firstDueOn: '2026-11-01' })).toBe(true)
  })
})

describe('planProgress', () => {
  // R2,000 a month for 4 months, due on the 1st.
  const schedule = buildSchedule('2026-07-01', 4, 800_000)
  const states = (p: ReturnType<typeof planProgress>) => p.instalments.map((i) => i.state)

  it('marks the first unpaid instalment as next and the rest upcoming', () => {
    const p = planProgress(schedule, [], '2026-06-15')
    expect(states(p)).toEqual(['next', 'upcoming', 'upcoming', 'upcoming'])
    expect(p.next?.number).toBe(1)
    expect(p).toMatchObject({ missedCount: 0, paidLateCount: 0, arrearsCents: 0 })
  })

  it('counts unpaid instalments past their due date as missed, with the arrears', () => {
    const p = planProgress(schedule, [pay(200_000, '2026-07-01'), pay(50_000, '2026-08-03')], '2026-09-10')
    expect(states(p)).toEqual(['paid', 'missed', 'missed', 'next'])
    expect(p.instalments[1].paidCents).toBe(50_000)
    expect(p).toMatchObject({ missedCount: 2, arrearsCents: 350_000 })
    // The next payment goes towards the oldest unpaid instalment.
    expect(p.next?.number).toBe(2)
  })

  it('does not call an instalment missed on its due date', () => {
    expect(states(planProgress(schedule, [], '2026-07-01'))[0]).toBe('next')
    expect(states(planProgress(schedule, [], '2026-07-02'))[0]).toBe('missed')
  })

  it('remembers instalments that were caught up late', () => {
    const p = planProgress(schedule, [pay(200_000, '2026-07-01'), pay(400_000, '2026-08-20')], '2026-08-25')
    expect(states(p)).toEqual(['paid', 'paid-late', 'paid', 'next'])
    expect(p.instalments.map((i) => i.paidOn)).toEqual(['2026-07-01', '2026-08-20', '2026-08-20', null])
    expect(p).toMatchObject({ missedCount: 0, paidLateCount: 1, arrearsCents: 0 })
  })

  it('applies payments in date order whatever order they are stored in', () => {
    const p = planProgress(schedule, [pay(200_000, '2026-08-01'), pay(200_000, '2026-06-30')], '2026-08-02')
    expect(p.instalments.slice(0, 2).map((i) => i.paidOn)).toEqual(['2026-06-30', '2026-08-01'])
    expect(states(p).slice(0, 2)).toEqual(['paid', 'paid'])
  })

  it('has no next instalment once everything is paid', () => {
    const p = planProgress(schedule, [pay(800_000, '2026-06-01')], '2026-12-01')
    expect(p.next).toBeNull()
    expect(states(p)).toEqual(['paid', 'paid', 'paid', 'paid'])
  })

  it('keeps what was missed before a loan was forgiven and forgives the rest', () => {
    const p = planProgress(schedule, [], '2026-12-01', '2026-08-15')
    expect(states(p)).toEqual(['missed', 'missed', 'forgiven', 'forgiven'])
    expect(p.missedCount).toBe(2)
  })
})
