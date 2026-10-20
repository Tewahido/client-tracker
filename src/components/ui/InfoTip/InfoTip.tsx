import { Info } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { usePopover } from '../../../hooks/usePopover'
import { infoTipStyles as s } from './InfoTip.styles'

interface InfoTipProps {
  /** Names both the info button and the panel it opens, e.g. "What each role can do". */
  label: string
  children: ReactNode
}

/** A small info button that opens extra help on click or tap (works on phones, unlike hover tooltips). */
export function InfoTip({ label, children }: InfoTipProps) {
  const { rootRef, panelRef, panelStyle, open, toggle } = usePopover<HTMLSpanElement>()
  const panelId = useId()

  return (
    <span ref={rootRef} className={s.root}>
      <button
        type="button"
        className={s.trigger[open ? 'open' : 'closed']}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <Info className={s.icon} />
      </button>
      {open && (
        <div ref={panelRef} id={panelId} role="region" aria-label={label} className={s.panel} style={panelStyle}>
          {children}
        </div>
      )}
    </span>
  )
}
