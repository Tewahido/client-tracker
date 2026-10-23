import { useCallback, useMemo, type FormEvent } from 'react'
import { useFormState } from '../../../hooks/useFormState'
import { shiftDate, today } from '../../../lib/dates'
import { totalDueCents } from '../../../lib/loans'
import { centsToInput, parseMoney } from '../../../lib/money'
import type { Loan } from '../../../lib/types'
import { useLendingDefaults } from '../../../hooks/useLendingDefaults'
import { useLoanStore } from '../../../providers/loanStoreContext'

/** Sentinel select value meaning "create a new person from the typed name". */
export const NEW_BORROWER = '__new__'

export interface LoanFormValues extends Record<string, string> {
  borrowerId: string
  newBorrowerName: string
  amount: string
  interestRate: string
  lentOn: string
  dueOn: string
  note: string
}

export const DUE_PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
]

export function validateLoan(v: LoanFormValues): Partial<Record<keyof LoanFormValues, string>> {
  const errors: Partial<Record<keyof LoanFormValues, string>> = {}
  if (!v.borrowerId) errors.borrowerId = 'Who did you lend to?'
  if (v.borrowerId === NEW_BORROWER && !v.newBorrowerName.trim()) errors.newBorrowerName = 'Enter their name'
  const amount = parseMoney(v.amount)
  if (amount === null || amount <= 0) errors.amount = 'Enter an amount greater than zero'
  const rate = Number(v.interestRate || 0)
  if (!Number.isFinite(rate) || rate < 0 || rate > 1000) errors.interestRate = 'Use a percentage between 0 and 1000'
  if (!v.lentOn) errors.lentOn = 'Pick a date'
  if (!v.dueOn) errors.dueOn = 'Pick a due date'
  else if (v.lentOn && v.dueOn < v.lentOn) errors.dueOn = "Due date can't be before the loan date"
  return errors
}

/** Create or edit a loan, optionally creating the borrower inline. */
export function useLoanForm(
  { loanId, borrowerId }: { loanId?: string; borrowerId?: string },
  onSaved: (loan: Loan) => void,
) {
  const { loans, borrowers, addBorrower, addLoan, updateLoan } = useLoanStore()
  const { defaults } = useLendingDefaults()
  const existing = loanId ? loans.find((l) => l.id === loanId) : undefined
  const start = today()

  const form = useFormState<LoanFormValues>(
    {
      borrowerId: existing?.borrowerId ?? borrowerId ?? (borrowers.length ? '' : NEW_BORROWER),
      newBorrowerName: '',
      amount: existing ? centsToInput(existing.principalCents) : '',
      interestRate: existing ? (existing.interestRate ? String(existing.interestRate) : '') : defaults.interestRate ? String(defaults.interestRate) : '',
      lentOn: existing?.lentOn ?? start,
      dueOn: existing?.dueOn ?? shiftDate(start, defaults.termDays),
      note: existing?.note ?? '',
    },
    validateLoan,
  )

  const { values, setValue, submit } = form

  const applyDuePreset = useCallback(
    (days: number) => setValue('dueOn', shiftDate(values.lentOn || start, days)),
    [setValue, values.lentOn, start],
  )

  /** Live preview of what will be owed, shown under the amount fields. */
  const preview = useMemo(() => {
    const principal = parseMoney(values.amount)
    const rate = Number(values.interestRate || 0)
    if (!principal || !Number.isFinite(rate) || rate <= 0) return null
    return totalDueCents({ principalCents: principal, interestRate: rate })
  }, [values.amount, values.interestRate])

  const sortedBorrowers = useMemo(() => [...borrowers].sort((a, b) => a.name.localeCompare(b.name)), [borrowers])

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      void submit(async (v) => {
        let resolvedBorrowerId = v.borrowerId
        if (v.borrowerId === NEW_BORROWER) {
          resolvedBorrowerId = (await addBorrower({ name: v.newBorrowerName.trim(), phone: null, email: null, notes: null })).id
          // If saving the loan fails below, a retry must not create the person twice.
          setValue('borrowerId', resolvedBorrowerId)
        }
        const input = {
          borrowerId: resolvedBorrowerId,
          principalCents: parseMoney(v.amount)!,
          interestRate: Number(v.interestRate || 0),
          lentOn: v.lentOn,
          dueOn: v.dueOn,
          note: v.note.trim() || null,
          instalmentCount: null,
          firstDueOn: null,
          agreedTotalCents: null,
        }
        onSaved(existing ? await updateLoan(existing.id, input) : await addLoan(input))
      })
    },
    [submit, addBorrower, setValue, existing, updateLoan, addLoan, onSaved],
  )

  return { ...form, isEdit: !!existing, borrowers: sortedBorrowers, applyDuePreset, preview, onSubmit }
}
