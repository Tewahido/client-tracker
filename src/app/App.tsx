import { Toaster } from 'sonner'
import { useHashRoute } from '../hooks/useHashRoute'
import { useTheme } from '../hooks/useTheme'
import { LoanStoreProvider } from '../providers/LoanStoreProvider'
import { useLoanStore } from '../providers/loanStoreContext'
import { SettingsProvider } from '../providers/SettingsProvider'
import { AppShell } from './AppShell'
import { OverlayHost } from './OverlayHost'
import { OverlayProvider } from './OverlayProvider'
import { useOverlay } from './overlayContext'
import type { RouteName } from './routes'

function Page({ name }: { name: RouteName }) {
  switch (name) {
    default:
      return <p className="text-muted">Coming soon: {name}</p>
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
        <Page name={route.name} />
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
