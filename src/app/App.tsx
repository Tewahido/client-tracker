import { Toaster } from 'sonner'
import { DashboardPage } from '../features/dashboard'
import { isLoanFilter, LoansPage } from '../features/loans'
import { OrgSwitcher } from '../features/organizations'
import { PeoplePage } from '../features/people'
import { NotificationBell, useReminderNotifications } from '../features/reminders'
import { SettingsPage } from '../features/settings'
import { useDeepLink } from '../hooks/useDeepLink'
import { useHashRoute } from '../hooks/useHashRoute'
import { usePermissions } from '../hooks/usePermissions'
import { useTheme } from '../hooks/useTheme'
import { LoanStoreProvider } from '../providers/LoanStoreProvider'
import { useLoanStore } from '../providers/loanStoreContext'
import { SettingsProvider } from '../providers/SettingsProvider'
import { WorkspaceProvider } from '../providers/WorkspaceProvider'
import { useWorkspace } from '../providers/workspaceContext'
import { AppShell } from './AppShell'
import { LoadError } from './LoadError'
import { OverlayHost } from './OverlayHost'
import { OverlayProvider } from './OverlayProvider'
import { useOverlay } from './overlayContext'
import type { Route } from './routes'
import { WorkspaceGate } from './WorkspaceGate'

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'home':
      return <DashboardPage />
    case 'loans': {
      const status = route.params.get('status')
      // Keyed so following a dashboard link (e.g. #loans?status=overdue) resets the filter.
      return <LoansPage key={status} initialFilter={isLoanFilter(status) ? status : undefined} />
    }
    case 'people':
      return <PeoplePage />
    case 'settings':
      return <SettingsPage />
  }
}

function Layout() {
  const { route, navigate } = useHashRoute()
  const { backend, views, status: loadStatus, error: loadError, reload } = useLoanStore()
  const overlay = useOverlay()
  const { status } = useWorkspace()
  const { canEdit } = usePermissions()
  const overdue = views.filter((v) => v.status === 'overdue').length
  useReminderNotifications()
  useDeepLink(route)

  return (
    <>
      <AppShell
        current={route.name}
        onNavigate={navigate}
        onNewLoan={canEdit ? () => overlay.open({ type: 'loan-form' }) : undefined}
        loansBadge={overdue}
        backend={backend}
        actions={<NotificationBell onOpenLoan={(loanId) => overlay.open({ type: 'loan', loanId })} />}
        workspace={status === 'ready' ? <OrgSwitcher onCreate={() => overlay.open({ type: 'org-form' })} /> : undefined}
      >
        {loadStatus === 'error' ? <LoadError message={loadError} onRetry={reload} /> : <Page route={route} />}
      </AppShell>
      <OverlayHost />
    </>
  )
}

export default function App() {
  const { theme } = useTheme()
  return (
    <SettingsProvider>
      <WorkspaceProvider>
        <WorkspaceGate>
          {(orgId) => (
            // Keyed by organisation so switching starts from a clean store and closes open dialogs.
            <LoanStoreProvider key={orgId ?? 'local'} orgId={orgId}>
              <OverlayProvider>
                <Layout />
              </OverlayProvider>
            </LoanStoreProvider>
          )}
        </WorkspaceGate>
      </WorkspaceProvider>
      <Toaster position="top-center" richColors closeButton theme={theme} />
    </SettingsProvider>
  )
}
