import clsx from 'clsx'
import { Bell, BellRing } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Avatar, Button } from '../../../../components/ui'
import { useDismissable } from '../../../../hooks/useDismissable'
import { useMoney } from '../../../../hooks/useMoney'
import { dueLabel } from '../../../../lib/describe'
import { sortByUrgency } from '../../../../lib/loans'
import { useLoanStore } from '../../../../providers/loanStoreContext'
import { useNotificationPermission } from '../../hooks/useNotificationPermission'
import { notificationBellStyles as s } from './NotificationBell.styles'

/** Bell in the top bar: badge with loans needing attention, a dropdown list, and an opt-in prompt. */
export function NotificationBell({ onOpenLoan }: { onOpenLoan: (loanId: string) => void }) {
  const { views } = useLoanStore()
  const money = useMoney()
  const { active, permission, enable } = useNotificationPermission()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismissable(rootRef, open, close)

  const urgent = useMemo(
    () => sortByUrgency(views.filter((v) => v.status === 'overdue' || v.status === 'due-today' || v.status === 'due-soon')),
    [views],
  )

  return (
    <div className={s.root} ref={rootRef}>
      <button className={s.button} onClick={() => setOpen((o) => !o)} aria-label={`Reminders${urgent.length ? `, ${urgent.length} need attention` : ''}`} aria-expanded={open}>
        {urgent.length ? <BellRing className={s.icon} /> : <Bell className={s.icon} />}
        {urgent.length > 0 && <span className={s.badge}>{urgent.length}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={s.panel}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className={s.head}>
              <span className={s.title}>Needs attention</span>
              <span className={s.count}>{urgent.length || 'None'}</span>
            </div>
            {urgent.length === 0 ? (
              <p className={s.empty}>All good. Nothing is due soon. 🎉</p>
            ) : (
              <div className={s.list}>
                {urgent.map((v) => (
                  <button
                    key={v.loan.id}
                    className={s.item}
                    onClick={() => {
                      close()
                      onOpenLoan(v.loan.id)
                    }}
                  >
                    <Avatar name={v.borrower?.name ?? '?'} size="sm" />
                    <div className={s.itemMain}>
                      <div className={s.itemName}>{v.borrower?.name ?? 'Unknown'}</div>
                      <div className={clsx(s.itemDue, v.status === 'overdue' && s.itemDueUrgent)}>{dueLabel(v)}</div>
                    </div>
                    <span className={s.itemAmount}>{money(v.balanceCents)}</span>
                  </button>
                ))}
              </div>
            )}
            {!active && permission !== 'unsupported' && (
              <div className={s.cta}>
                <span className={s.ctaText}>
                  {permission === 'denied' ? 'Notifications are blocked in your browser settings.' : 'Get a heads-up on this device when payments are due.'}
                </span>
                {permission !== 'denied' && (
                  <Button size="sm" onClick={enable}>
                    Turn on
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
