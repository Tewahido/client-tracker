import { BellRing, HandCoins, Plus, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '../../../../components/ui'
import { welcomeStyles as s } from './Welcome.styles'

const STEPS = [
  { icon: HandCoins, title: 'Record a loan', text: 'Who, how much and when it should come back.' },
  { icon: BellRing, title: 'Get reminded', text: 'Notifications before and on the due date.' },
  { icon: Wallet, title: 'Track repayments', text: 'Log partial payments and watch balances shrink.' },
]

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <motion.section className={s.root} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className={s.bg} />
      <div className={s.content}>
        <div className={s.emoji}>🤝</div>
        <h1 className={s.title}>Welcome to Lendly</h1>
        <p className={s.text}>Lent someone money? Keep it friendly and keep it on record. Lendly tracks who owes what and nudges you when it's time to collect.</p>
        <div className={s.steps}>
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className={s.step}>
              <Icon className={s.stepIcon} />
              <div className={s.stepTitle}>{title}</div>
              <div className={s.stepText}>{text}</div>
            </div>
          ))}
        </div>
        <div className={s.action}>
          <Button size="lg" icon={Plus} onClick={onStart}>
            Record your first loan
          </Button>
        </div>
      </div>
    </motion.section>
  )
}
