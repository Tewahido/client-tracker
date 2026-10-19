import { RotateCcw } from 'lucide-react'
import { lazy, Suspense, type ReactNode } from 'react'
import { CenteredLayout } from '../../components/layout/CenteredLayout'
import { Button } from '../../components/ui'
import { OnboardingScreen } from '../../features/organizations'
import { useWorkspace } from '../../providers/workspaceContext'
import { workspaceGateStyles as s } from './WorkspaceGate.styles'

// Only signed-out visitors need the landing page; keep it out of the app's main bundle.
const LandingPage = lazy(() => import('../../features/landing').then((m) => ({ default: m.LandingPage })))

/**
 * Decides what to show before the main app: the landing page (with sign-in), organisation onboarding,
 * or the app itself for the active organisation (null orgId = local-only mode).
 */
export function WorkspaceGate({ children }: { children: (orgId: string | null) => ReactNode }) {
  const ws = useWorkspace()

  switch (ws.status) {
    case 'local':
      return children(null)
    case 'ready':
      return children(ws.activeOrg!.id)
    case 'signed-out':
      return (
        <Suspense fallback={<GateLoading />}>
          <LandingPage />
        </Suspense>
      )
    case 'needs-org':
      return <OnboardingScreen />
    case 'error':
      return (
        <CenteredLayout>
          <h1 className={s.errorTitle}>We couldn't load your organisations</h1>
          <p className={s.errorText}>{ws.error}</p>
          <div className={s.errorActions}>
            <Button icon={RotateCcw} onClick={ws.refresh}>
              Try again
            </Button>
            <Button variant="ghost" onClick={ws.signOut}>
              Sign out
            </Button>
          </div>
        </CenteredLayout>
      )
    default:
      return <GateLoading />
  }
}

function GateLoading() {
  return (
    <div className={s.loading} aria-busy="true" aria-label="Loading">
      <img src="/favicon.svg" alt="" className={s.loadingMark} />
    </div>
  )
}
