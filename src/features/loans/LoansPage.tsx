import { HandCoins, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useOverlay } from '../../app/overlayContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button, Card, EmptyState, SearchInput, SegmentedControl } from '../../components/ui'
import { useMoney } from '../../hooks/useMoney'
import { usePermissions } from '../../hooks/usePermissions'
import { useLoanStore } from '../../providers/loanStoreContext'
import { LoanRow } from './components/LoanRow'
import { FILTER_LABELS, useLoanFilters, type LoanFilter, type LoanSort } from './hooks/useLoanFilters'
import { loansPageStyles as s } from './LoansPage.styles'

const FILTERS: LoanFilter[] = ['open', 'overdue', 'soon', 'closed', 'all']

export function LoansPage({ initialFilter }: { initialFilter?: LoanFilter }) {
  const { views } = useLoanStore()
  const { filter, setFilter, sort, setSort, query, setQuery, counts, visible } = useLoanFilters(views, initialFilter)
  const overlay = useOverlay()
  const money = useMoney()
  const { canEdit } = usePermissions()
  const newLoan = () => overlay.open({ type: 'loan-form' })
  const outstanding = views.reduce((sum, v) => sum + (v.status === 'paid' || v.status === 'written-off' ? 0 : v.balanceCents), 0)

  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title="Loans"
        subtitle={views.length ? `${money(outstanding)} still out across ${counts.open} open ${counts.open === 1 ? 'loan' : 'loans'}` : undefined}
        actions={
          canEdit && (
            <Button icon={Plus} onClick={newLoan}>
              New loan
            </Button>
          )
        }
      />

      {views.length === 0 ? (
        <Card>
          <EmptyState
            icon={HandCoins}
            title="No loans yet"
            description="Record money you've lent and Lendly will keep track of what's owed and remind you when it's due."
            action={
              canEdit && (
                <Button icon={Plus} onClick={newLoan}>
                  Record your first loan
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className={s.toolbar}>
            <SegmentedControl
              label="Filter loans"
              value={filter}
              onChange={setFilter}
              options={FILTERS.map((f) => ({ value: f, label: FILTER_LABELS[f], count: counts[f] }))}
            />
            <div className={s.toolbarRight}>
              <SearchInput value={query} onChange={setQuery} placeholder="Search name or note" />
              <select className={s.sort} value={sort} onChange={(e) => setSort(e.target.value as LoanSort)} aria-label="Sort loans">
                <option value="urgency">Most urgent</option>
                <option value="amount">Largest balance</option>
                <option value="recent">Most recent</option>
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className={s.noResults}>{query ? `No loans match "${query}".` : `Nothing in ${FILTER_LABELS[filter].toLowerCase()} right now.`}</p>
          ) : (
            <motion.div layout className={s.list}>
              <AnimatePresence initial={false}>
                {visible.map((view) => (
                  <motion.div key={view.loan.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
                    <LoanRow view={view} onOpen={() => overlay.open({ type: 'loan', loanId: view.loan.id })} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </>
  )
}
