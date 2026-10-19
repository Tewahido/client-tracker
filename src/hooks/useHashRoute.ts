import { useCallback, useSyncExternalStore } from 'react'
import { buildHash, parseHash, type RouteName } from '../app/routes'

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

/** Minimal hash router: works on any static host with no server rewrites. */
export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  const navigate = useCallback((name: RouteName, params?: Record<string, string>) => {
    window.location.hash = buildHash(name, params)
    window.scrollTo({ top: 0 })
  }, [])
  return { route: parseHash(hash), navigate }
}
