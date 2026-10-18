import { ArrowRight } from 'lucide-react'
import { useOverlay } from '../../app/overlayContext'
import { Button, Card, CardHeader } from '../../components/ui'
import { useHashRoute } from '../../hooks/useHashRoute'
import { AttentionList } from './components/AttentionList'
import { CollectionsChart } from './components/CollectionsChart'
import { Hero } from './components/Hero'
import { RecentPayments } from './components/RecentPayments'
import { StatTiles } from './components/StatTiles'
import { Welcome } from './components/Welcome'
import { dashboardStyles as s } from './DashboardPage.styles'
import { useDashboard } from './hooks/useDashboard'

export function DashboardPage() {
  const d = useDashboard()
  const overlay = useOverlay()
  const { navigate } = useHashRoute()
  const openLoan = (loanId: string) => overlay.open({ type: 'loan', loanId })

  if (!d.ready) return <div className={s.skeleton} />
  if (!d.hasLoans) return <Welcome onStart={() => overlay.open({ type: 'loan-form' })} />

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
            <CollectionsChart data={d.chart} />
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
