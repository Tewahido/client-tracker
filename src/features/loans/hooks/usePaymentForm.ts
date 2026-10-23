import { useCallback, type FormEvent } from 'react'
import { useFormState } from '../../../hooks/useFormState'
import { useMoney } from '../../../hooks/useMoney'
import { today } from '../../../lib/dates'
import { instalmentHistoryLabel } from '../../../lib/describe'
import { amountDueNowCents } from '../../../lib/loans'
import { centsToInput, parseMoney } from '../../../lib/money'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { celebrate } from '../../../services/celebrate'

interface PaymentFormValues extends Record<string, string> {
  amount: string
  paidOn: string
  note: string
}

/** Record a repayment against a loan. Pre-fills the remaining balance. */
export function usePaymentForm(loanId: string, onSaved: () => void) {
  const { viewById, recordPayment } = useLoanStore()
  const money = useMoney()
  const view = viewById.get(loanId)
  const balance = view?.balanceCents ?? 0

  const validate = useCallback(
    (v: PaymentFormValues) => {
      const errors: Partial<Record<keyof PaymentFormValues, string>> = {}
      const amount = parseMoney(v.amount)
      if (amount === null || amount <= 0) errors.amount = 'Enter an amount greater than zero'
      else if (amount > balance) errors.amount = `That's more than the ${money(balance)} still owed`
      if (!v.paidOn) errors.paidOn = 'Pick a date'
      return errors
    },
    [balance, money],
  )

  // Monthly plans start from what is due now (missed instalments, or the next one) rather than everything.
  const suggested = view ? amountDueNowCents(view) : 0
  const form = useFormState<PaymentFormValues>({ amount: centsToInput(suggested), paidOn: today(), note: '' }, validate)
  const { submit, setValue } = form

  const setShare = useCallback((share: number) => setValue('amount', centsToInput(Math.round(balance * share))), [balance, setValue])

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      void submit(async (v) => {
        const amountCents = parseMoney(v.amount)!
        await recordPayment({ loanId, amountCents, paidOn: v.paidOn, note: v.note.trim() || null })
        if (amountCents >= balance) celebrate()
        onSaved()
      })
    },
    [submit, recordPayment, loanId, balance, onSaved],
  )

  /** Why a monthly plan's amount was suggested. */
  const amountHint = !view?.plan?.next
    ? undefined
    : view.plan.missedCount
      ? `Catches up ${instalmentHistoryLabel(view.plan.missedCount, 0)}`
      : `Instalment ${view.plan.next.number} of ${view.plan.instalments.length}`

  return { ...form, view, balance, amountHint, setShare, onSubmit }
}
