import { ChevronDown } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { usePopover } from '../../../../hooks/usePopover'
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
  const { rootRef, panelRef, panelStyle, open, toggle, close } = usePopover()

  if (!activeOrg) return null

  return (
    <div className={s.root} ref={rootRef}>
      <button
        className={cn(s.trigger, open && s.triggerOpen)}
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Organisation: ${activeOrg.name}${invites.length ? `, ${inviteCount(invites.length)} waiting` : ''}`}
      >
        <span className={s.name}>{activeOrg.name}</span>
        <ChevronDown className={cn(s.chevron, open && s.chevronOpen)} />
        {invites.length > 0 && <span className={s.dot} />}
      </button>
      <AnimatePresence>
        {open && <OrgMenu ref={panelRef} style={panelStyle} placement="below" onClose={close} onCreate={onCreate} onManage={onManage} />}
      </AnimatePresence>
    </div>
  )
}
