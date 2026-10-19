import { useEffect } from 'react'
import { useOverlay } from '../app/overlayContext'
import type { Route } from '../app/routes'
import { useLoanStore } from '../providers/loanStoreContext'

/**
 * Opens the loan named in `?open=<loanId>` (used by notification clicks), then
 * drops the parameter so a refresh doesn't reopen it.
 */
export function useDeepLink(route: Route) {
  const { open } = useOverlay()
  const { status, viewById } = useLoanStore()
  const loanId = route.params.get('open')
  const routeName = route.name
  const query = route.params.toString()

  useEffect(() => {
    if (!loanId || status !== 'ready') return
    if (viewById.has(loanId)) open({ type: 'loan', loanId })

    const rest = new URLSearchParams(query)
    rest.delete('open')
    const remaining = rest.toString()
    history.replaceState(null, '', `#${routeName}${remaining ? `?${remaining}` : ''}`)
    // replaceState doesn't fire hashchange; tell the router so `open` disappears from the route.
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }, [loanId, status, viewById, open, routeName, query])
}
