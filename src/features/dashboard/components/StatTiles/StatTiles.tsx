import clsx from 'clsx'
import { AlarmClock, CalendarClock, PiggyBank, TrendingUp, type LucideIcon } from 'lucide-react'
import { Card } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import type { PortfolioStats } from '../../../../lib/loans'
import { statTilesStyles as s } from './StatTiles.styles'

interface Tile {
  label: string
  value: string
  sub: string
  icon: LucideIcon
  tone: keyof typeof s.tone
  onClick?: () => void
}

interface StatTilesProps {
  stats: PortfolioStats
  onShowOverdue: () => void
  onShowSoon: () => void
}

export function StatTiles({ stats, onShowOverdue, onShowSoon }: StatTilesProps) {
  const money = useMoney()
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

  const tiles: Tile[] = [
    { label: 'Overdue', value: money(stats.overdueCents), sub: plural(stats.overdueCount, 'loan'), icon: AlarmClock, tone: 'rose', onClick: onShowOverdue },
    { label: 'Due this week', value: money(stats.dueThisWeekCents), sub: plural(stats.dueThisWeekCount, 'loan'), icon: CalendarClock, tone: 'amber', onClick: onShowSoon },
    { label: 'Collected this month', value: money(stats.collectedThisMonthCents), sub: 'Payments received', icon: PiggyBank, tone: 'emerald' },
    { label: 'Lent in total', value: money(stats.totalLentCents), sub: `${money(stats.totalCollectedCents)} back so far`, icon: TrendingUp, tone: 'violet' },
  ]

  return (
    <div className={s.grid}>
      {tiles.map((t) => (
        <Card
          key={t.label}
          padding="sm"
          interactive={!!t.onClick}
          className={s.tile}
          onClick={t.onClick}
          role={t.onClick ? 'button' : undefined}
          tabIndex={t.onClick ? 0 : undefined}
          onKeyDown={t.onClick ? (e) => e.key === 'Enter' && t.onClick?.() : undefined}
        >
          <div className={s.head}>
            <span className={s.label}>{t.label}</span>
            <span className={clsx(s.iconWrap, s.tone[t.tone])}>
              <t.icon className={s.icon} />
            </span>
          </div>
          <div>
            <div className={s.value}>{t.value}</div>
            <div className={s.sub}>{t.sub}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
