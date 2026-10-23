import { useMemo } from 'react'
import { toast } from 'sonner'
import { useMoney } from '../../../hooks/useMoney'
import { formatDate, today } from '../../../lib/dates'
import { extendedDueDate } from '../../../lib/loans'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { celebrate } from '../../../services/celebrate'

/** One-tap actions on a single loan, with friendly feedback. Errors are toasted by the store. */
export function useLoanActions(loanId: string) {
  const { viewById, recordPayment, updateLoan, removeLoan, removePayment } = useLoanStore()
  const money = useMoney()

  return useMemo(() => {
    const view = () => {
      const v = viewById.get(loanId)
      if (!v) throw new Error('Loan not found')
      return v
    }

    return {
      async markPaidInFull() {
        const v = view()
        await recordPayment({ loanId, amountCents: v.balanceCents, paidOn: today(), note: 'Paid in full' })
        celebrate()
        toast.success(`${v.borrower?.name ?? 'Loan'} is all paid up!`, { description: `${money(v.totalDueCents)} collected in total.` })
      },

      async extendDueDate(days: number) {
        const dueOn = extendedDueDate(view(), days, today())
        await updateLoan(loanId, { dueOn })
        toast.success(`New due date: ${formatDate(dueOn)}`)
      },

      async forgive() {
        const v = view()
        await updateLoan(loanId, { writtenOffOn: today() })
        toast(`Forgave ${money(v.balanceCents)}`, { description: 'You can undo this from the loan details.' })
      },

      async reopen() {
        await updateLoan(loanId, { writtenOffOn: null })
        toast.success('Loan reopened')
      },

      async remove() {
        await removeLoan(loanId)
        toast('Loan deleted')
      },

      async removePayment(paymentId: string) {
        await removePayment(paymentId)
        toast('Payment removed')
      },
    }
  }, [loanId, viewById, recordPayment, updateLoan, removeLoan, removePayment, money])
}
