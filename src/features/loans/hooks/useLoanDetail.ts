import { useCallback, useState } from 'react'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { useLoanActions } from './useLoanActions'

export type LoanConfirm = { kind: 'delete' } | { kind: 'forgive' } | { kind: 'delete-payment'; paymentId: string }

/** Everything the loan detail dialog needs: the live view, actions and which confirmation is showing. */
export function useLoanDetail(loanId: string) {
  const { viewById } = useLoanStore()
  const view = viewById.get(loanId)
  const actions = useLoanActions(loanId)
  const [confirm, setConfirm] = useState<LoanConfirm | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  /** Run an action while flagging which button is busy; errors were already toasted by the store. */
  const run = useCallback(async (key: string, task: () => Promise<void>) => {
    setBusy(key)
    try {
      await task()
    } catch {
      /* reported by the store */
    } finally {
      setBusy(null)
    }
  }, [])

  return { view, actions, confirm, setConfirm, closeConfirm: () => setConfirm(null), busy, run }
}
