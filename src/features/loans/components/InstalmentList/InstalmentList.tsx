import { useMoney } from '../../../../hooks/useMoney'
import { cn } from '../../../../lib/cn'
import { formatDate } from '../../../../lib/dates'
import { INSTALMENT_STATE_LABEL } from '../../../../lib/describe'
import type { InstalmentProgress } from '../../../../lib/instalments'
import { instalmentListStyles as s } from './InstalmentList.styles'

/** A monthly plan's instalments with their due dates and whether each was paid, paid late or missed. */
export function InstalmentList({ instalments }: { instalments: InstalmentProgress[] }) {
  const money = useMoney()

  return (
    <ol className={s.list} aria-label="Repayment plan">
      {instalments.map((i) => (
        <li key={i.number} className={s.row}>
          <span className={s.number}>{i.number}</span>
          <div className={s.main}>
            <div className={s.date}>{formatDate(i.dueOn)}</div>
            <div className={s.meta}>
              {i.paidOn
                ? `${money(i.amountCents)} · paid ${formatDate(i.paidOn, 'd MMM yyyy')}`
                : i.paidCents > 0
                  ? `${money(i.paidCents)} of ${money(i.amountCents)} paid`
                  : money(i.amountCents)}
            </div>
          </div>
          <span className={cn(s.state.base, s.state[i.state])}>{INSTALMENT_STATE_LABEL[i.state]}</span>
        </li>
      ))}
    </ol>
  )
}
