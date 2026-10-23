import { describe, expect, it } from 'vitest'
import { anchorFor, impliedRate, parseMonths, reconcilePlan, type PlanFields } from './planFields'

const fields = (patch: Partial<PlanFields> = {}): PlanFields => ({ amount: '20000', interestRate: '', months: '12', monthly: '', total: '', ...patch })

describe('reconcilePlan', () => {
  it('works out the total and monthly payment from the monthly figure', () => {
    // "If I set 2k for 12 months, total gets set to 24k."
    expect(reconcilePlan(fields({ monthly: '2000' }), 'monthly')).toEqual(fields({ monthly: '2000', total: '24000', interestRate: '20' }))
  })

  it('works out the monthly payment from the total', () => {
    // "If I set total to 24k then monthly gets set to 2k."
    expect(reconcilePlan(fields({ total: '24000' }), 'total')).toEqual(fields({ total: '24000', monthly: '2000', interestRate: '20' }))
  })

  it('works out the total and monthly payment from the interest', () => {
    expect(reconcilePlan(fields({ interestRate: '10' }), 'rate')).toEqual(fields({ interestRate: '10', total: '22000', monthly: '1833.33' }))
  })

  it('keeps the monthly payment when the months change after typing it', () => {
    expect(reconcilePlan(fields({ monthly: '2000', months: '6' }), 'monthly').total).toBe('12000')
  })

  it('keeps the total when the months change after typing it', () => {
    expect(reconcilePlan(fields({ total: '24000', months: '6' }), 'total').monthly).toBe('4000')
  })

  it('never rewrites the field being typed', () => {
    expect(reconcilePlan(fields({ total: '25000.5' }), 'total').total).toBe('25000.5')
    expect(reconcilePlan(fields({ monthly: '2,000' }), 'monthly').monthly).toBe('2,000')
  })

  it('clears figures that cannot be worked out yet instead of leaving them stale', () => {
    expect(reconcilePlan(fields({ monthly: '2000', months: '', total: '24000' }), 'monthly').total).toBe('')
    expect(reconcilePlan(fields({ amount: '', total: '24000', monthly: '2000' }), 'rate')).toMatchObject({ total: '', monthly: '' })
  })

  it('leaves the interest blank rather than negative when the total is below the amount', () => {
    expect(reconcilePlan(fields({ total: '15000' }), 'total').interestRate).toBe('')
  })

  it('leaves the interest alone until the amount lent is known', () => {
    expect(reconcilePlan(fields({ amount: '', interestRate: '5', monthly: '2000' }), 'monthly').interestRate).toBe('5')
  })
})

describe('anchorFor', () => {
  it('follows the money field the lender touched and ignores the rest', () => {
    expect(anchorFor('interestRate', 'total')).toBe('rate')
    expect(anchorFor('total', 'rate')).toBe('total')
    expect(anchorFor('monthly', 'total')).toBe('monthly')
    expect(anchorFor('months', 'monthly')).toBe('monthly')
    expect(anchorFor('amount', 'total')).toBe('total')
  })
})

describe('parseMonths', () => {
  it.each([
    ['12', 12],
    [' 6 ', 6],
    ['0', null],
    ['1.5', null],
    ['', null],
    ['x', null],
  ])('%j -> %s', (input, expected) => {
    expect(parseMonths(input)).toBe(expected)
  })
})

describe('impliedRate', () => {
  it('rounds to two decimals', () => {
    expect(impliedRate(2_000_000, 2_400_000)).toBe(20)
    expect(impliedRate(1_750_000, 2_400_000)).toBe(37.14)
    expect(impliedRate(1_000_000, 1_000_000)).toBe(0)
  })
})
