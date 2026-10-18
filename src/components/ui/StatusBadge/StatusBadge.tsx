import clsx from 'clsx'
import type { LoanStatus } from '../../../lib/types'
import { statusBadgeStyles as s } from './StatusBadge.styles'
import { STATUS_META } from './statusMeta'

export function StatusBadge({ status, className }: { status: LoanStatus; className?: string }) {
  const { label, icon: Icon, tone } = STATUS_META[status]
  return (
    <span className={clsx(s.base, tone, className)}>
      <Icon className={s.icon} strokeWidth={2.5} />
      {label}
    </span>
  )
}
