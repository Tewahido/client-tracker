import { Building2, Check, LayoutList, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { inviteCount } from '../../../../lib/invites'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { orgMenuStyles as s } from './OrgMenu.styles'

interface OrgMenuProps {
  /** Opens above the control (sidebar footer) or below it (phone top bar). */
  placement: 'above' | 'below'
  onClose: () => void
  onCreate: () => void
  onManage: () => void
  /** Extra entries after a separator, e.g. Sign out. */
  children?: ReactNode
  /** For keeping the panel inside the window (see usePopover). */
  ref?: Ref<HTMLDivElement>
  style?: CSSProperties
}

/** Popup listing the user's organisations to switch between, plus "All organisations" and "New organisation". */
export function OrgMenu({ placement, onClose, onCreate, onManage, children, ref, style }: OrgMenuProps) {
  const { organizations, activeOrg, invites, switchOrg } = useWorkspace()
  const offset = placement === 'above' ? 6 : -6

  const choose = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    <motion.div
      ref={ref}
      style={style}
      role="group"
      aria-label="Organisations"
      className={s.menu[placement]}
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: offset }}
      transition={{ duration: 0.15 }}
    >
      <div className={s.label} aria-hidden="true">
        Organisations
      </div>
      {organizations.map((org) => (
        <button key={org.id} className={s.item} onClick={choose(() => switchOrg(org.id))}>
          <Building2 className={s.itemIcon} />
          <span className={s.itemName}>{org.name}</span>
          {org.id === activeOrg?.id && <Check className={s.itemCheck} />}
        </button>
      ))}
      <button className={s.item} onClick={choose(onManage)}>
        <LayoutList className={s.itemIcon} />
        <span className={s.itemName}>All organisations</span>
        {invites.length > 0 && (
          <span className={s.count} aria-label={inviteCount(invites.length)}>
            {invites.length}
          </span>
        )}
      </button>
      <button className={s.item} onClick={choose(onCreate)}>
        <Plus className={s.itemIcon} />
        New organisation
      </button>
      {children && (
        <>
          <div className={s.separator} />
          {children}
        </>
      )}
    </motion.div>
  )
}
