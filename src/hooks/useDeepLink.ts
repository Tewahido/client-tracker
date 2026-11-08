import { useEffect } from 'react'
import { useOverlay } from '../app/overlayContext'
import type { Route } from '../app/routes'
import { useLoanStore } from '../providers/loanStoreContext'
import { useWorkspace } from '../providers/workspaceContext'

/**
 * Opens the loan named in `?open=<loanId>` (used by notification clicks), then drops the
 * parameter so a refresh doesn't reopen it. A reminder sent with the app closed also names
 * its organisation (`&org=<id>`): if that isn't the one open, switch to it first (if the
 * person belongs to it), and the loan opens once its ledger has loaded.
 */
export function useDeepLink(route: Route) {
  const { open } = useOverlay()
  const { status, viewById } = useLoanStore()
  const { activeOrg, organizations, switchOrg } = useWorkspace()
  const loanId = route.params.get('open')
  const orgId = route.params.get('org')
  const routeName = route.name
  const query = route.params.toString()
  const switchTo = orgId && orgId !== activeOrg?.id && organizations.some((o) => o.id === orgId) ? orgId : null

  useEffect(() => {
    if (switchTo) {
      switchOrg(switchTo)
      return
    }
    if ((!loanId && !orgId) || status !== 'ready') return
    if (loanId && viewById.has(loanId)) open({ type: 'loan', loanId })

    const rest = new URLSearchParams(query)
    rest.delete('open')
    rest.delete('org')
    const remaining = rest.toString()
    history.replaceState(null, '', `#${routeName}${remaining ? `?${remaining}` : ''}`)
    // replaceState doesn't fire hashchange; tell the router so `open` disappears from the route.
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [switchTo, switchOrg, loanId, orgId, status, viewById, open, routeName, query])
}
