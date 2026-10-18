import { Toaster } from 'sonner'
import { isLoanFilter, LoansPage } from '../features/loans'
import { PeoplePage } from '../features/people'
import { useHashRoute } from '../hooks/useHashRoute'
import { useTheme } from '../hooks/useTheme'
import { LoanStoreProvider } from '../providers/LoanStoreProvider'
import { useLoanStore } from '../providers/loanStoreContext'
import { SettingsProvider } from '../providers/SettingsProvider'
import { AppShell } from './AppShell'
import { OverlayHost } from './OverlayHost'
import { OverlayProvider } from './OverlayProvider'
import { useOverlay } from './overlayContext'
import type { Route } from './routes'

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'loans': {
      const status = route.params.get('status')
      // Keyed so following a dashboard link (e.g. #loans?status=overdue) resets the filter.
      return <LoansPage key={status} initialFilter={isLoanFilter(status) ? status : undefined} />
    }
    case 'people':
      return <PeoplePage />
    default:
      return <p className="text-muted">Coming soon: {route.name}</p>
  }
}

function Layout() {
  const { route, navigate } = useHashRoute()
  const { backend, views } = useLoanStore()
  const overlay = useOverlay()
  const overdue = views.filter((v) => v.status === 'overdue').length

  return (
    <>
      <AppShell
        current={route.name}
        onNavigate={navigate}
        onNewLoan={() => overlay.open({ type: 'loan-form' })}
        loansBadge={overdue}
        backend={backend}
      >
        <Page route={route} />
      </AppShell>
      <OverlayHost />
    </>
  )
}

export default function App() {
  const { theme } = useTheme()
  return (
    <SettingsProvider>
      <LoanStoreProvider>
        <OverlayProvider>
          <Layout />
        </OverlayProvider>
      </LoanStoreProvider>
      <Toaster position="top-center" richColors closeButton theme={theme} />
    </SettingsProvider>
  )
}
