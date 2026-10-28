import { ChevronRight } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { inviteCount } from '../../../../lib/invites'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { orgChipStyles as s } from './OrgChip.styles'

/**
 * Phone top bar: the organisation that's open, opening the Organisations page (highlighted while
 * that page is showing). Dotted when invites wait.
 */
export function OrgChip({ onOpen, active }: { onOpen: () => void; active: boolean }) {
  const { activeOrg, invites } = useWorkspace()
  if (!activeOrg) return null

  return (
    <button
      className={cn(s.root, active && s.active)}
      onClick={onOpen}
      aria-current={active ? 'page' : undefined}
      aria-label={`Organisation: ${activeOrg.name}${invites.length ? `, ${inviteCount(invites.length)} waiting` : ''}`}
    >
      <span className={s.name}>{activeOrg.name}</span>
      <ChevronRight className={s.chevron} />
      {invites.length > 0 && <span className={s.dot} />}
    </button>
  )
}
