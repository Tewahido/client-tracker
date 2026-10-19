import { cn } from '../../../../lib/cn'
import { Avatar, Card, ProgressBar, STATUS_META, StatusBadge } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { formatDate } from '../../../../lib/dates'
import { dueLabel } from '../../../../lib/describe'
import { isOpen, type LoanView } from '../../../../lib/loans'
import { loanRowStyles as s } from './LoanRow.styles'

interface LoanRowProps {
  view: LoanView
  onOpen: () => void
  /** Hide the borrower name, e.g. when already inside that person's page. */
  hideBorrower?: boolean
}

export function LoanRow({ view, onOpen, hideBorrower }: LoanRowProps) {
  const money = useMoney()
  const { loan, borrower, status } = view
  const open = isOpen(status)
  const name = borrower?.name ?? 'Unknown'
  const subtitle = loan.note ?? `Lent ${formatDate(loan.lentOn, 'd MMM yyyy')}`

  return (
    <Card padding="sm" interactive className={s.root} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className={s.top}>
        {!hideBorrower && <Avatar name={name} size="sm" />}
        <div className={s.who}>
          <div className={s.name}>{hideBorrower ? money(loan.principalCents) : name}</div>
          <div className={s.sub}>{subtitle}</div>
        </div>
        <div className={s.amounts}>
          <div className={cn(s.balance, !open && s.balanceDone)}>{money(open ? view.balanceCents : view.totalDueCents)}</div>
          <div className={s.total}>{open ? `of ${money(view.totalDueCents)}` : 'collected'}</div>
        </div>
      </div>
      <div className={s.bottom}>
        <div className={s.barWrap}>
          <ProgressBar value={view.progress} colorClass={STATUS_META[status].accent} />
        </div>
        <span className={cn(s.due, status === 'overdue' && s.dueUrgent)}>{dueLabel(view)}</span>
        <StatusBadge status={status} />
      </div>
    </Card>
  )
}
