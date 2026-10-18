import { cn } from '../../../../lib/cn'
import { Star } from 'lucide-react'
import { Avatar, Card } from '../../../../components/ui'
import { relativeDays } from '../../../../lib/dates'
import { useMoney } from '../../../../hooks/useMoney'
import type { PersonSummary } from '../../hooks/usePeople'
import { personCardStyles as s } from './PersonCard.styles'

export function OnTimeRating({ rate }: { rate: number | null }) {
  if (rate === null) return null
  const tone = rate >= 0.8 ? s.ratingGood : rate >= 0.5 ? s.ratingOk : s.ratingPoor
  return (
    <span className={cn(s.rating, tone)} title="Share of loans repaid on time">
      <Star className={s.ratingIcon} fill="currentColor" />
      {Math.round(rate * 100)}% on time
    </span>
  )
}

export function PersonCard({ person, onOpen }: { person: PersonSummary; onOpen: () => void }) {
  const money = useMoney()
  const { borrower, stats } = person
  const next = stats.nextDue

  return (
    <Card interactive className={s.root} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className={s.top}>
        <Avatar name={borrower.name} />
        <div className={s.identity}>
          <div className={s.name}>{borrower.name}</div>
          <div className={s.contact}>{borrower.phone ?? borrower.email ?? 'No contact details'}</div>
        </div>
        <OnTimeRating rate={stats.onTimeRate} />
      </div>
      <div className={s.bottom}>
        <div>
          <div className={s.amountLabel}>Owes you</div>
          <div className={cn(s.amount, stats.outstandingCents === 0 && s.amountClear)}>{money(stats.outstandingCents)}</div>
        </div>
        <div className={s.meta}>
          <div>
            <span className={s.metaStrong}>{stats.openLoans}</span> open · {stats.settledLoans} repaid
          </div>
          {next && <div className={next.daysUntilDue < 0 ? s.overdue : undefined}>Next due {relativeDays(next.daysUntilDue)}</div>}
        </div>
      </div>
    </Card>
  )
}
