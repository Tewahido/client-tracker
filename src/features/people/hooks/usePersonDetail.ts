import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { sortByUrgency } from '../../../lib/loans'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { usePersonSummary } from './usePeople'

/** Data and actions for a single person's detail view. */
export function usePersonDetail(borrowerId: string) {
  const summary = usePersonSummary(borrowerId)
  const { removeBorrower } = useLoanStore()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const loans = useMemo(() => (summary ? sortByUrgency(summary.views) : []), [summary])

  const remove = useCallback(async () => {
    const name = summary?.borrower.name
    await removeBorrower(borrowerId)
    toast(`${name ?? 'Person'} removed`)
  }, [removeBorrower, borrowerId, summary])

  return { summary, loans, confirmDelete, setConfirmDelete, remove }
}
