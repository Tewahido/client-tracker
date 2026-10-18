import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { OverlayContext, type Overlay } from './overlayContext'

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Overlay[]>([])

  const open = useCallback((overlay: Overlay) => setStack((s) => [...s, overlay]), [])
  const close = useCallback(() => setStack((s) => s.slice(0, -1)), [])
  const replace = useCallback((overlay: Overlay) => setStack((s) => [...s.slice(0, -1), overlay]), [])

  const value = useMemo(() => ({ stack, open, close, replace }), [stack, open, close, replace])
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>
}
