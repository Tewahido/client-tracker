import clsx from 'clsx'
import { Building2, Check, ChevronsUpDown, LogOut, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { useDismissable } from '../../../../hooks/useDismissable'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { orgSwitcherStyles as s } from './OrgSwitcher.styles'

/** Sidebar control showing the active organisation, with switching, creating and signing out. */
export function OrgSwitcher({ onCreate }: { onCreate: () => void }) {
  const { organizations, activeOrg, switchOrg, user, signOut } = useWorkspace()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismissable(rootRef, open, close)

  if (!activeOrg) return null

  return (
    <div className={s.root} ref={rootRef}>
      <AnimatePresence>
        {open && (
          <motion.div className={s.menu} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.15 }}>
            <div className={s.menuLabel}>Organisations</div>
            {organizations.map((org) => (
              <button
                key={org.id}
                className={s.item}
                onClick={() => {
                  switchOrg(org.id)
                  close()
                }}
              >
                <Building2 className={s.itemIcon} />
                <span className={s.itemName}>{org.name}</span>
                {org.id === activeOrg.id && <Check className={s.itemCheck} />}
              </button>
            ))}
            <button
              className={s.item}
              onClick={() => {
                close()
                onCreate()
              }}
            >
              <Plus className={s.itemIcon} />
              New organisation
            </button>
            <div className={s.separator} />
            <button className={clsx(s.item, s.danger)} onClick={signOut}>
              <LogOut className={s.itemIcon} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button className={s.trigger} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        <span className={s.badge}>{activeOrg.name.slice(0, 1).toUpperCase()}</span>
        <span className={s.info}>
          <span className={s.name}>{activeOrg.name}</span>
          <span className={s.sub}>{user?.email}</span>
        </span>
        <ChevronsUpDown className={s.chevron} />
      </button>
    </div>
  )
}
