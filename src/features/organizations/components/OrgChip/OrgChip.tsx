import { ChevronDown } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { useDismissable } from '../../../../hooks/useDismissable'
import { cn } from '../../../../lib/cn'
import { inviteCount } from '../../../../lib/invites'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { OrgMenu } from '../OrgMenu'
import { orgChipStyles as s } from './OrgChip.styles'

/**
 * Phone top bar: the organisation that's open. Tapping it opens the organisation menu to
 * switch (tapping again, outside or Escape closes it). Dotted when invites wait.
 */
export function OrgChip({ onCreate, onManage }: { onCreate: () => void; onManage: () => void }) {
  const { activeOrg, invites } = useWorkspace()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismissable(rootRef, open, close)

  if (!activeOrg) return null

  return (
    <div className={s.root} ref={rootRef}>
      <button
        className={cn(s.trigger, open && s.triggerOpen)}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Organisation: ${activeOrg.name}${invites.length ? `, ${inviteCount(invites.length)} waiting` : ''}`}
      >
        <span className={s.name}>{activeOrg.name}</span>
        <ChevronDown className={cn(s.chevron, open && s.chevronOpen)} />
        {invites.length > 0 && <span className={s.dot} />}
      </button>
      <AnimatePresence>{open && <OrgMenu placement="below" onClose={close} onCreate={onCreate} onManage={onManage} />}</AnimatePresence>
    </div>
  )
}
