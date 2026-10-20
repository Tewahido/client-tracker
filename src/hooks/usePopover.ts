import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useDismissable } from './useDismissable'

/** Keep this far from the window edge when deciding whether a panel fits. */
const EDGE = 8

/**
 * Open/close state for a click-to-open popover that closes on Escape or an outside press.
 * `align` is 'start' (panel grows rightwards) unless that would run off the window and
 * growing leftwards fits, in which case it's 'end'.
 */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const rootRef = useRef<T>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState<'start' | 'end'>('start')
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((o) => !o), [])
  useDismissable(rootRef, open, close)

  // Measure before paint so the panel never flashes in the wrong place.
  useLayoutEffect(() => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!open || !root || !panel) return
    const anchor = root.getBoundingClientRect()
    const width = panel.offsetWidth
    const fitsRight = anchor.left + width <= window.innerWidth - EDGE
    const fitsLeft = anchor.right - width >= EDGE
    setAlign(!fitsRight && fitsLeft ? 'end' : 'start')
  }, [open])

  return { rootRef, panelRef, open, align, toggle, close }
}
