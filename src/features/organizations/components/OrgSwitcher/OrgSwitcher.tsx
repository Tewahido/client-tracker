import { cn } from '../../../../lib/cn'
import { ChevronsUpDown, LogOut } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { useDismissable } from '../../../../hooks/useDismissable'
import { inviteCount } from '../../../../lib/invites'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { ROLE_LABEL } from '../../roles'
import { OrgMenu } from '../OrgMenu'
import { orgSwitcherStyles as s } from './OrgSwitcher.styles'

/** Sidebar control showing the active organisation, with switching, creating and signing out. */
export function OrgSwitcher({ onCreate, onManage }: { onCreate: () => void; onManage: () => void }) {
  const { activeOrg, invites, user, signOut } = useWorkspace()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismissable(rootRef, open, close)

  if (!activeOrg) return null

  return (
    <div className={s.root} ref={rootRef}>
      <AnimatePresence>
        {open && (
          <OrgMenu placement="above" onClose={close} onCreate={onCreate} onManage={onManage}>
            <button className={cn(s.item, s.danger)} onClick={signOut}>
              <LogOut className={s.itemIcon} />
              Sign out
            </button>
          </OrgMenu>
        )}
      </AnimatePresence>

      <button
        className={s.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Organisation: ${activeOrg.name}, ${ROLE_LABEL[activeOrg.role]}${invites.length ? `, ${inviteCount(invites.length)} waiting` : ''}`}
      >
        <span className={s.badge}>
          {activeOrg.name.slice(0, 1).toUpperCase()}
          {invites.length > 0 && <span className={s.dot} />}
        </span>
        <span className={s.info}>
          <span className={s.name}>{activeOrg.name}</span>
          <span className={s.sub}>
            {ROLE_LABEL[activeOrg.role]} · {user?.email}
          </span>
        </span>
        <ChevronsUpDown className={s.chevron} />
      </button>
    </div>
  )
}
