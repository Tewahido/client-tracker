import { ArrowRight } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { useOverlay } from '../../app/overlayContext'
import { Button, Card, CardHeader } from '../../components/ui'
import { useHashRoute } from '../../hooks/useHashRoute'
import { usePermissions } from '../../hooks/usePermissions'
import { AttentionList } from './components/AttentionList'
import { Hero } from './components/Hero'
import { RecentPayments } from './components/RecentPayments'
import { StatTiles } from './components/StatTiles'
import { Welcome } from './components/Welcome'
import { dashboardStyles as s } from './DashboardPage.styles'
import { useDashboard } from './hooks/useDashboard'

// The chart library is the heaviest dependency; load it after the rest of the dashboard.
const CollectionsChart = lazy(() => import('./components/CollectionsChart').then((m) => ({ default: m.CollectionsChart })))

export function DashboardPage() {
  const d = useDashboard()
  const overlay = useOverlay()
  const { navigate } = useHashRoute()
  const { canEdit } = usePermissions()
  const openLoan = (loanId: string) => overlay.open({ type: 'loan', loanId })

  if (!d.ready) return <div className={s.skeleton} />
  if (!d.hasLoans) return <Welcome onStart={canEdit ? () => overlay.open({ type: 'loan-form' }) : undefined} />

  return (
    <div className={s.stack}>
      <Hero
        greeting={d.greeting}
        outstandingCents={d.stats.outstandingCents}
        openCount={d.openCount}
        borrowersWithDebt={d.stats.borrowersWithDebt}
        collectedCents={d.stats.totalCollectedCents}
        recoveryRate={d.recoveryRate}
      />

      <StatTiles stats={d.stats} onShowOverdue={() => navigate('loans', { status: 'overdue' })} onShowSoon={() => navigate('loans', { status: 'soon' })} />

      <div className={s.columns}>
        <Card className={s.wide}>
          <CardHeader
            title={
              <>
                Coming up {d.urgentCount > 0 && <span className={s.count}>{d.urgentCount} need attention</span>}
              </>
            }
            action={
              <Button variant="ghost" size="sm" trailingIcon={ArrowRight} onClick={() => navigate('loans')}>
                All loans
              </Button>
            }
          />
          <AttentionList views={d.attention} onOpen={openLoan} />
        </Card>

        <div className={s.side}>
          <Card>
            <CardHeader title="Collected per month" />
            <Suspense fallback={<div className={s.chartPlaceholder} />}>
              <CollectionsChart data={d.chart} />
            </Suspense>
          </Card>
          <Card>
            <CardHeader title="Recent payments" />
            <RecentPayments items={d.recentPayments} />
          </Card>
        </div>
      </div>
    </div>
  )
}
