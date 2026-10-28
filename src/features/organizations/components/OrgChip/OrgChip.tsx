import { ChevronDown } from 'lucide-react'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { orgChipStyles as s } from './OrgChip.styles'

/** Phone top bar: the organisation that's open, opening the Organisations page. Dotted when invites wait. */
export function OrgChip({ onOpen }: { onOpen: () => void }) {
  const { activeOrg, invites } = useWorkspace()
  if (!activeOrg) return null

  return (
    <button
      className={s.root}
      onClick={onOpen}
      aria-label={`Organisation: ${activeOrg.name}${invites.length ? `, ${invites.length} invite${invites.length > 1 ? 's' : ''} waiting` : ''}`}
    >
      <span className={s.name}>{activeOrg.name}</span>
      <ChevronDown className={s.chevron} />
      {invites.length > 0 && <span className={s.dot} />}
    </button>
  )
}
