import clsx from 'clsx'
import { PartyPopper } from 'lucide-react'
import { Avatar, StatusBadge } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { dueLabel } from '../../../../lib/describe'
import type { LoanView } from '../../../../lib/loans'
import { attentionListStyles as s } from './AttentionList.styles'

export function AttentionList({ views, onOpen }: { views: LoanView[]; onOpen: (loanId: string) => void }) {
  const money = useMoney()

  if (views.length === 0) {
    return (
      <div className={s.allClear}>
        <span className={s.allClearIcon}>
          <PartyPopper className={s.allClearSvg} />
        </span>
        <p className={s.allClearTitle}>Nothing due in the next 30 days</p>
        <p className={s.allClearText}>Sit back. We'll remind you when something comes up.</p>
      </div>
    )
  }

  return (
    <ul className={s.list}>
      {views.map((v) => (
        <li key={v.loan.id}>
          <button className={s.row} onClick={() => onOpen(v.loan.id)}>
            <Avatar name={v.borrower?.name ?? '?'} size="sm" />
            <div className={s.main}>
              <div className={s.name}>{v.borrower?.name ?? 'Unknown'}</div>
              <div className={clsx(s.due, v.status === 'overdue' && s.dueUrgent)}>{dueLabel(v)}</div>
            </div>
            <span className={s.amount}>{money(v.balanceCents)}</span>
            <StatusBadge status={v.status} />
          </button>
        </li>
      ))}
    </ul>
  )
}
