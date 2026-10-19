import { useMemo, useState } from 'react'
import { isOpen, needsAttention, outstandingCents, sortByUrgency, type LoanView } from '../../../lib/loans'

export type LoanFilter = 'open' | 'overdue' | 'soon' | 'closed' | 'all'
export type LoanSort = 'urgency' | 'amount' | 'recent'

export const FILTER_LABELS: Record<LoanFilter, string> = {
  open: 'Open',
  overdue: 'Overdue',
  soon: 'Due soon',
  closed: 'Closed',
  all: 'All',
}

const matchers: Record<LoanFilter, (v: LoanView) => boolean> = {
  open: (v) => isOpen(v.status),
  overdue: (v) => v.status === 'overdue',
  soon: (v) => needsAttention(v.status) && v.status !== 'overdue',
  closed: (v) => !isOpen(v.status),
  all: () => true,
}

const sorters: Record<LoanSort, (views: LoanView[]) => LoanView[]> = {
  urgency: sortByUrgency,
  amount: (views) => [...views].sort((a, b) => b.balanceCents - a.balanceCents || b.totalDueCents - a.totalDueCents),
  recent: (views) => [...views].sort((a, b) => b.loan.lentOn.localeCompare(a.loan.lentOn) || b.loan.createdAt.localeCompare(a.loan.createdAt)),
}

export function isLoanFilter(value: string | null): value is LoanFilter {
  return !!value && value in matchers
}

/** Filter, search and sort state for the loans list. */
export function useLoanFilters(views: LoanView[], initialFilter: LoanFilter = 'open') {
  const [filter, setFilter] = useState<LoanFilter>(initialFilter)
  const [sort, setSort] = useState<LoanSort>('urgency')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const result = {} as Record<LoanFilter, number>
    for (const key of Object.keys(matchers) as LoanFilter[]) result[key] = views.filter(matchers[key]).length
    return result
  }, [views])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = views.filter(
      (v) => matchers[filter](v) && (!q || v.borrower?.name.toLowerCase().includes(q) || v.loan.note?.toLowerCase().includes(q)),
    )
    return sorters[sort](filtered)
  }, [views, filter, sort, query])

  const outstanding = useMemo(() => outstandingCents(views), [views])

  return { filter, setFilter, sort, setSort, query, setQuery, counts, visible, outstandingCents: outstanding }
}
