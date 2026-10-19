import { RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { CenteredLayout } from '../../components/layout/CenteredLayout'
import { Button } from '../../components/ui'
import { SignInScreen } from '../../features/auth'
import { OnboardingScreen } from '../../features/organizations'
import { useWorkspace } from '../../providers/workspaceContext'
import { workspaceGateStyles as s } from './WorkspaceGate.styles'

/**
 * Decides what to show before the main app: sign-in, organisation onboarding,
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
      return <SignInScreen />
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
      return (
        <div className={s.loading} aria-busy="true" aria-label="Loading">
          <img src="/favicon.svg" alt="" className={s.loadingMark} />
        </div>
      )
  }
}
