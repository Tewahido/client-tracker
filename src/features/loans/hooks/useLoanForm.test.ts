import { describe, expect, it } from 'vitest'
import { validateLoan, type LoanFormValues } from './useLoanForm'

const monthly = (patch: Partial<LoanFormValues> = {}): LoanFormValues => ({
  borrowerId: 'b',
  newBorrowerName: '',
  amount: '20000',
  interestRate: '20',
  lentOn: '2026-10-01',
  dueOn: '',
  note: '',
  repayment: 'monthly',
  months: '12',
  monthly: '2000',
  total: '24000',
  firstDueOn: '2026-11-01',
  anchor: 'monthly',
  ...patch,
})

describe('validateLoan (monthly)', () => {
  it('accepts a complete plan', () => {
    expect(validateLoan(monthly())).toEqual({})
  })

  it.each([
    [{ months: '1' }, 'months', 'Use 2 to 360 months'],
    [{ months: '361' }, 'months', 'Use 2 to 360 months'],
    [{ monthly: '' }, 'monthly', 'Enter the monthly payment'],
    [{ total: '19999' }, 'total', "That's less than you lent"],
    [{ total: '300000' }, 'total', "That's more than 1000% interest"],
    [{ amount: '0.05', total: '0.05' }, 'total', "That's less than a cent a month"],
    [{ firstDueOn: '2026-09-30' }, 'firstDueOn', "Can't be before the loan date"],
  ] as const)('%j -> %s', (patch, field, message) => {
    expect(validateLoan(monthly(patch))[field]).toBe(message)
  })

  it('ignores the once-off due date', () => {
    expect(validateLoan(monthly({ dueOn: '' })).dueOn).toBeUndefined()
  })
})
