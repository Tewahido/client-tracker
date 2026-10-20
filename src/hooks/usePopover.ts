import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useDismissable } from './useDismissable'

/** Keep at least this far from the window edges. */
const EDGE = 8

/**
 * Open/close state for a click-to-open popover that closes on Escape or an outside press.
 * The panel starts at its anchor's left edge and is shifted (via `panelStyle`) just enough
 * to stay inside the window, even on very narrow phones; it is re-measured on resize.
 */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const rootRef = useRef<T>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [shift, setShift] = useState(0)
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((o) => !o), [])
  useDismissable(rootRef, open, close)

  const place = useCallback(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return
    const anchorLeft = root.getBoundingClientRect().left
    // clientWidth, not innerWidth: on phones innerWidth grows while the panel overflows.
    const maxLeft = document.documentElement.clientWidth - panel.offsetWidth - EDGE
    const left = Math.max(EDGE, Math.min(anchorLeft, maxLeft))
    setShift(left - anchorLeft)
  }, [])

  // Measure before paint so the panel never flashes in the wrong place.
  useLayoutEffect(() => {
    if (!open) return
    place()
    // On phones the panel can open below the fold or under the bottom navigation.
    panelRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [open, place])

  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open, place])

  const panelStyle: CSSProperties = { left: shift }
  return { rootRef, panelRef, panelStyle, open, toggle, close }
}
