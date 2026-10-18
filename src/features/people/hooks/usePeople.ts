import { useMemo, useState } from 'react'
import { borrowerStats, type BorrowerStats, type LoanView } from '../../../lib/loans'
import type { Borrower } from '../../../lib/types'
import { useLoanStore } from '../../../providers/loanStoreContext'

export interface PersonSummary {
  borrower: Borrower
  stats: BorrowerStats
  views: LoanView[]
}

/** Group loan views by borrower. */
export function usePersonSummaries(): PersonSummary[] {
  const { borrowers, views } = useLoanStore()
  return useMemo(() => {
    const byBorrower = new Map<string, LoanView[]>()
    for (const v of views) {
      const list = byBorrower.get(v.loan.borrowerId)
      if (list) list.push(v)
      else byBorrower.set(v.loan.borrowerId, [v])
    }
    return borrowers.map((borrower) => {
      const own = byBorrower.get(borrower.id) ?? []
      return { borrower, stats: borrowerStats(own), views: own }
    })
  }, [borrowers, views])
}

export function usePersonSummary(borrowerId: string): PersonSummary | undefined {
  const all = usePersonSummaries()
  return useMemo(() => all.find((p) => p.borrower.id === borrowerId), [all, borrowerId])
}

/** People list with search, ordered by who owes the most. */
export function usePeopleList() {
  const all = usePersonSummaries()
  const [query, setQuery] = useState('')

  const people = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all
      .filter(({ borrower: b }) => !q || [b.name, b.phone, b.email].some((field) => field?.toLowerCase().includes(q)))
      .sort((a, b) => b.stats.outstandingCents - a.stats.outstandingCents || a.borrower.name.localeCompare(b.borrower.name))
  }, [all, query])

  return { people, total: all.length, query, setQuery }
}
