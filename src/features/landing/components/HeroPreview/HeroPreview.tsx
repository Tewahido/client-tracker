import { BellRing } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Avatar, ProgressRing, STATUS_META, StatusBadge } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import type { LoanStatus } from '../../../../lib/types'
import { useHeroDemo } from '../../hooks/useHeroDemo'
import { heroPreviewStyles as s } from './HeroPreview.styles'

const SAMPLE: { name: string; detail: string; cents: number; status: LoanStatus }[] = [
  { name: 'Sipho Dlamini', detail: 'Car repair · due in 3 days', cents: 115_000, status: 'due-soon' },
  { name: 'Thandi Nkosi', detail: 'School fees · paid on time', cents: 80_000, status: 'paid' },
]
const TOTAL_OUT_CENTS = 417_500

/** Decorative, animated mock of the app shown beside the hero copy. */
export function HeroPreview() {
  const { progress, showReminder } = useHeroDemo()
  // Same formatting as the real app, so the preview never looks different from it.
  const money = useMoney()

  return (
    <div className={s.root} aria-hidden>
      <div className={s.glow} />
      <motion.div
        className={s.window}
        initial={{ opacity: 0, y: 24, rotate: -2 }}
        animate={{ opacity: 1, y: [0, -8, 0], rotate: 0 }}
        transition={{ opacity: { duration: 0.5 }, rotate: { duration: 0.6 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <div className={s.bar}>
          <span className={s.dot} />
          <span className={s.dot} />
          <span className={s.dot} />
        </div>
        <div className={s.body}>
          <div>
            <div className={s.totalLabel}>Out with people right now</div>
            <div className={s.total}>{money(TOTAL_OUT_CENTS)}</div>
          </div>
          {SAMPLE.map((loan, i) => (
            <motion.div
              key={loan.name}
              className={s.row}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
            >
              <Avatar name={loan.name} size="sm" />
              <div className={s.rowMain}>
                <div className={s.rowName}>{loan.name}</div>
                <div className={s.rowSub}>{loan.detail}</div>
              </div>
              <span className={s.rowAmount}>{money(loan.cents, { compact: true })}</span>
              <ProgressRing value={progress[i]} size={40} stroke={4} colorClass={STATUS_META[loan.status].stroke} showLabel={false} />
              <StatusBadge status={loan.status} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {showReminder && (
          <motion.div
            className={s.toast}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.9 }}
          >
            <span className={s.toastIcon}>
              <BellRing className={s.toastIconSvg} />
            </span>
            <div>
              <div className={s.toastTitle}>Sipho's payment is due Friday</div>
              <div className={s.toastText}>{money(SAMPLE[0].cents)} still owed to you</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
