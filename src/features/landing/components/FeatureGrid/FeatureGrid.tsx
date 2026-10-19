import { BellRing, FileSpreadsheet, HandCoins, ShieldCheck, Star, Users, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '../../../../lib/cn'
import { featureGridStyles as s } from './FeatureGrid.styles'

interface Feature {
  icon: LucideIcon
  title: string
  text: string
  tone: keyof typeof s.tone
}

const FEATURES: Feature[] = [
  { icon: HandCoins, tone: 'emerald', title: 'Every loan at a glance', text: 'Amounts, interest, partial payments and what is still owed, with progress you can see.' },
  { icon: BellRing, tone: 'amber', title: 'Reminders before it gets awkward', text: 'A nudge before, on and after the due date, plus calendar alerts that work even when the app is closed.' },
  { icon: Users, tone: 'violet', title: 'Share it with your partner', text: 'One ledger for your household or team, with owner, member and view-only roles.' },
  { icon: Star, tone: 'sky', title: 'Know who pays on time', text: 'Each person gets an on-time rating, so the next "can I borrow…" is an easier call.' },
  { icon: FileSpreadsheet, tone: 'rose', title: 'Your records, your way', text: 'Export to a spreadsheet, download a backup, and restore it anywhere by drag and drop.' },
  { icon: ShieldCheck, tone: 'teal', title: 'Private by design', text: 'Only people you invite can see your organisation. It installs on your phone and works offline.' },
]

export function FeatureGrid() {
  return (
    <section id="features" className={s.root} aria-labelledby="features-title">
      <div className={s.head}>
        <p className={s.eyebrow}>Features</p>
        <h2 id="features-title" className={s.title}>
          Everything you need to lend without the stress
        </h2>
        <p className={s.lead}>Built for informal lending between people who trust each other, and want to keep it that way.</p>
      </div>
      <ul className={s.grid}>
        {FEATURES.map((f, i) => (
          <motion.li
            key={f.title}
            className={s.card}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: (i % 3) * 0.08, duration: 0.5, ease: 'easeOut' }}
          >
            <span className={cn(s.shine, s.tone[f.tone].shine)} />
            <span className={cn(s.icon, s.tone[f.tone].icon)}>
              <f.icon className={s.iconSvg} />
            </span>
            <h3 className={s.cardTitle}>{f.title}</h3>
            <p className={s.cardText}>{f.text}</p>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
