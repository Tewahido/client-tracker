import { motion } from 'motion/react'
import { useMoney } from '../../../../hooks/useMoney'
import { heroStyles as s } from './Hero.styles'

interface HeroProps {
  greeting: string
  outstandingCents: number
  openCount: number
  borrowersWithDebt: number
  collectedCents: number
  recoveryRate: number
}

export function Hero({ greeting, outstandingCents, openCount, borrowersWithDebt, collectedCents, recoveryRate }: HeroProps) {
  const money = useMoney()
  const pct = Math.round(recoveryRate * 100)

  return (
    <motion.section className={s.root} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className={s.bg} />
      <div className={s.pattern} />
      <div className={s.shine} />
      <div className={s.content}>
        <p className={s.greeting}>{greeting} 👋</p>
        <p className={s.label}>Out with people right now</p>
        <p className={s.value}>{money(outstandingCents)}</p>
        <p className={s.sub}>
          {openCount === 0
            ? "Everyone's square with you. Nice!"
            : `${openCount} open ${openCount === 1 ? 'loan' : 'loans'} across ${borrowersWithDebt} ${borrowersWithDebt === 1 ? 'person' : 'people'}`}
        </p>
        <div className={s.progressWrap}>
          <div className={s.progressHead}>
            <span>{money(collectedCents)} collected so far</span>
            <span>{pct}% recovered</span>
          </div>
          <div className={s.progressTrack}>
            <motion.div className={s.progressFill} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
          </div>
        </div>
      </div>
    </motion.section>
  )
}
