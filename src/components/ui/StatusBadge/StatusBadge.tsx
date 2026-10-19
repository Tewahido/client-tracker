import { cn } from '../../../lib/cn'
import type { LoanStatus } from '../../../lib/types'
import { statusBadgeStyles as s } from './StatusBadge.styles'
import { STATUS_META } from './statusMeta'

export function StatusBadge({ status, className }: { status: LoanStatus; className?: string }) {
  const { label, icon: Icon, tone } = STATUS_META[status]
  return (
    <span className={cn(s.base, tone, className)}>
      <Icon className={s.icon} strokeWidth={2.5} />
      {label}
    </span>
  )
}
