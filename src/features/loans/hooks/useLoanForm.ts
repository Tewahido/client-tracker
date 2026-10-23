import { useCallback, useMemo, type ChangeEvent, type FormEvent } from 'react'
import { useFormState } from '../../../hooks/useFormState'
import { shiftDate, shiftMonths, today } from '../../../lib/dates'
import { hasPlan, lastInstalmentOn, MAX_INSTALMENTS, MIN_INSTALMENTS, splitTotal } from '../../../lib/instalments'
import { totalDueCents } from '../../../lib/loans'
import { centsToInput, parseMoney } from '../../../lib/money'
import { anchorFor, impliedRate, parseMonths, reconcilePlan, type PlanAnchor, type PlanFields } from '../../../lib/planFields'
import type { Loan, NewLoan } from '../../../lib/types'
import { useLendingDefaults } from '../../../hooks/useLendingDefaults'
import { useLoanStore } from '../../../providers/loanStoreContext'

/** Sentinel select value meaning "create a new person from the typed name". */
export const NEW_BORROWER = '__new__'

export type Repayment = 'once' | 'monthly'

export const REPAYMENT_OPTIONS: { value: Repayment; label: string }[] = [
  { value: 'once', label: 'All at once' },
  { value: 'monthly', label: 'Monthly' },
]

/** Plan length offered when switching a loan to monthly. */
const DEFAULT_MONTHS = 12

export interface LoanFormValues extends Record<string, string> {
  borrowerId: string
  newBorrowerName: string
  amount: string
  interestRate: string
  lentOn: string
  dueOn: string
  note: string
  repayment: Repayment
  months: string
  monthly: string
  total: string
  firstDueOn: string
  /** Which money figure the lender typed last; the others follow it. */
  anchor: PlanAnchor
}

export const DUE_PRESETS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
]

/** Highest interest the form accepts, typed or implied by a monthly plan. */
const MAX_RATE = 1000

export function validateLoan(v: LoanFormValues): Partial<Record<keyof LoanFormValues, string>> {
  const errors: Partial<Record<keyof LoanFormValues, string>> = {}
  if (!v.borrowerId) errors.borrowerId = 'Who did you lend to?'
  if (v.borrowerId === NEW_BORROWER && !v.newBorrowerName.trim()) errors.newBorrowerName = 'Enter their name'
  const amount = parseMoney(v.amount)
  if (amount === null || amount <= 0) errors.amount = 'Enter an amount greater than zero'
  if (!v.lentOn) errors.lentOn = 'Pick a date'

  if (v.repayment === 'monthly') {
    const months = parseMonths(v.months)
    if (months === null || months < MIN_INSTALMENTS || months > MAX_INSTALMENTS) errors.months = `Use ${MIN_INSTALMENTS} to ${MAX_INSTALMENTS} months`
    const monthly = parseMoney(v.monthly)
    if (monthly === null || monthly <= 0) errors.monthly = 'Enter the monthly payment'
    const total = parseMoney(v.total)
    if (total === null || total <= 0) errors.total = 'Enter the total to pay back'
    else if (months && total < months) errors.total = "That's less than a cent a month"
    else if (amount && total < amount) errors.total = "That's less than you lent"
    else if (amount && impliedRate(amount, total) > MAX_RATE) errors.total = `That's more than ${MAX_RATE}% interest`
    if (!v.firstDueOn) errors.firstDueOn = 'Pick a date'
    else if (v.lentOn && v.firstDueOn < v.lentOn) errors.firstDueOn = "Can't be before the loan date"
    return errors
  }

  const rate = Number(v.interestRate || 0)
  if (!Number.isFinite(rate) || rate < 0 || rate > MAX_RATE) errors.interestRate = `Use a percentage between 0 and ${MAX_RATE}`
  if (!v.dueOn) errors.dueOn = 'Pick a due date'
  else if (v.lentOn && v.dueOn < v.lentOn) errors.dueOn = "Due date can't be before the loan date"
  return errors
}

/** What the form would save, for the summary under the amounts. */
export type LoanFormPreview =
  | { kind: 'once'; totalCents: number }
  | { kind: 'monthly'; months: number; regularCents: number; lastCents: number; lastOn: string; interestCents: number }

type PlanField = keyof PlanFields

/** Form values for an existing loan's monthly plan, or a fresh one. */
function planValues(existing: Loan | undefined, lentOn: string) {
  if (existing && hasPlan(existing)) {
    const total = totalDueCents(existing)
    return {
      repayment: 'monthly' as const,
      months: String(existing.instalmentCount),
      monthly: centsToInput(splitTotal(total, existing.instalmentCount!).regularCents),
      total: centsToInput(total),
      firstDueOn: existing.firstDueOn!,
      // Keep the agreed total exactly as saved.
      anchor: 'total' as const,
    }
  }
  return { repayment: 'once' as const, months: '', monthly: '', total: '', firstDueOn: shiftMonths(lentOn, 1), anchor: 'rate' as const }
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
  const lentOn = existing?.lentOn ?? start

  const form = useFormState<LoanFormValues>(
    {
      borrowerId: existing?.borrowerId ?? borrowerId ?? (borrowers.length ? '' : NEW_BORROWER),
      newBorrowerName: '',
      amount: existing ? centsToInput(existing.principalCents) : '',
      interestRate: existing ? (existing.interestRate ? String(existing.interestRate) : '') : defaults.interestRate ? String(defaults.interestRate) : '',
      lentOn,
      dueOn: existing?.dueOn ?? shiftDate(start, defaults.termDays),
      note: existing?.note ?? '',
      ...planValues(existing, lentOn),
    },
    validateLoan,
  )

  const { values, setValue, submit } = form

  /** Set several fields at once (each clears its own error). */
  const setValues = useCallback(
    (next: Partial<LoanFormValues>) => {
      for (const [key, value] of Object.entries(next)) if (value !== values[key]) setValue(key, value as string)
    },
    [setValue, values],
  )

  /** Change one of the linked figures and recompute the ones that follow from it (monthly plans only). */
  const setPlanField = useCallback(
    (field: PlanField, value: string) => {
      if (values.repayment === 'once') return setValue(field, value)
      const anchor = anchorFor(field, values.anchor)
      const plan = reconcilePlan({ ...values, [field]: value }, anchor)
      setValues({ ...plan, [field]: value, anchor })
    },
    [values, setValue, setValues],
  )

  /** `onChange` for the amount, interest, months, monthly payment and total inputs. */
  const bindPlan = useCallback(
    (field: PlanField) => (e: ChangeEvent<HTMLInputElement>) => setPlanField(field, e.target.value),
    [setPlanField],
  )

  const setRepayment = useCallback(
    (repayment: Repayment) => {
      // Once-off loans are driven by the interest; a plan picks up from it when chosen again.
      if (repayment === 'once') return setValues({ repayment, anchor: 'rate' })
      const months = values.months || String(DEFAULT_MONTHS)
      setValues({ ...reconcilePlan({ ...values, months }, values.anchor), repayment })
    },
    [setValues, values],
  )

  /** On a new loan, moving the loan date drags an untouched first payment date along; saved plans keep theirs. */
  const onLentOnChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      const followFirst = !existing && next && values.firstDueOn === shiftMonths(values.lentOn, 1)
      setValues(followFirst ? { lentOn: next, firstDueOn: shiftMonths(next, 1) } : { lentOn: next })
    },
    [existing, setValues, values.firstDueOn, values.lentOn],
  )

  const applyDuePreset = useCallback(
    (days: number) => setValue('dueOn', shiftDate(values.lentOn || start, days)),
    [setValue, values.lentOn, start],
  )

  /** Live summary of what will be owed, shown under the amount fields. */
  const preview = useMemo<LoanFormPreview | null>(() => {
    const principal = parseMoney(values.amount)
    if (values.repayment === 'monthly') {
      const months = parseMonths(values.months)
      const total = parseMoney(values.total)
      if (!months || months < MIN_INSTALMENTS || !total || total < months || !values.firstDueOn) return null
      const { regularCents, lastCents } = splitTotal(total, months)
      const interestCents = principal ? Math.max(0, total - principal) : 0
      return { kind: 'monthly', months, regularCents, lastCents, lastOn: lastInstalmentOn(values.firstDueOn, months), interestCents }
    }
    const rate = Number(values.interestRate || 0)
    if (!principal || !Number.isFinite(rate) || rate <= 0) return null
    return { kind: 'once', totalCents: totalDueCents({ principalCents: principal, interestRate: rate }) }
  }, [values.amount, values.interestRate, values.repayment, values.months, values.total, values.firstDueOn])

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
        const principalCents = parseMoney(v.amount)!
        const common = { borrowerId: resolvedBorrowerId, principalCents, lentOn: v.lentOn, note: v.note.trim() || null }
        let input: NewLoan
        if (v.repayment === 'monthly') {
          const months = parseMonths(v.months)!
          const total = parseMoney(v.total)!
          input = {
            ...common,
            // Kept for display; the agreed total is what counts.
            interestRate: impliedRate(principalCents, total),
            dueOn: lastInstalmentOn(v.firstDueOn, months),
            instalmentCount: months,
            firstDueOn: v.firstDueOn,
            agreedTotalCents: total,
          }
        } else {
          input = { ...common, interestRate: Number(v.interestRate || 0), dueOn: v.dueOn, instalmentCount: null, firstDueOn: null, agreedTotalCents: null }
        }
        onSaved(existing ? await updateLoan(existing.id, input) : await addLoan(input))
      })
    },
    [submit, addBorrower, setValue, existing, updateLoan, addLoan, onSaved],
  )

  return {
    ...form,
    isEdit: !!existing,
    borrowers: sortedBorrowers,
    applyDuePreset,
    preview,
    bindPlan,
    setRepayment,
    onLentOnChange,
    onSubmit,
  }
}
