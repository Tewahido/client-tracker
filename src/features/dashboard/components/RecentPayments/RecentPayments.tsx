import { ArrowDownLeft } from 'lucide-react'
import { useMoney } from '../../../../hooks/useMoney'
import { formatDate } from '../../../../lib/dates'
import type { Borrower, Payment } from '../../../../lib/types'
import { recentPaymentsStyles as s } from './RecentPayments.styles'

export function RecentPayments({ items }: { items: { payment: Payment; borrower: Borrower | undefined }[] }) {
  const money = useMoney()

  if (items.length === 0) return <p className={s.empty}>Payments you record will show up here.</p>

  return (
    <ul className={s.list}>
      {items.map(({ payment, borrower }) => (
        <li key={payment.id} className={s.row}>
          <span className={s.icon}>
            <ArrowDownLeft className={s.iconSvg} />
          </span>
          <div className={s.main}>
            <div className={s.name}>{borrower?.name ?? 'Unknown'}</div>
            <div className={s.date}>{formatDate(payment.paidOn, 'EEE, d MMM')}</div>
          </div>
          <span className={s.amount}>+{money(payment.amountCents)}</span>
        </li>
      ))}
    </ul>
  )
}
