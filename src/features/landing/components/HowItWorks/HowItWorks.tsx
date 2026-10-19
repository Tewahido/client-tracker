import { motion } from 'motion/react'
import { FloatingArt, type LandingArt } from '../FloatingArt'
import { howItWorksStyles as s } from './HowItWorks.styles'

const STEPS: { title: string; text: string; art: LandingArt }[] = [
  { art: 'banknotes', title: 'Record a loan', text: 'Who you lent to, how much, any interest, and when it should come back. Takes ten seconds.' },
  { art: 'bell', title: 'Get reminded', text: 'Lendly nudges you before and after the due date, so nothing slips through the cracks.' },
  { art: 'party-popper', title: 'Mark it paid', text: 'Log full or partial repayments and watch the balance shrink. Settled loans get a little celebration.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className={s.root} aria-labelledby="how-title">
      <div className={s.inner}>
        <div className={s.head}>
          <p className={s.eyebrow}>How it works</p>
          <h2 id="how-title" className={s.title}>
            Three steps. That's it.
          </h2>
        </div>
        <ol className={s.steps}>
          <motion.span
            aria-hidden
            className={s.line}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              className={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ delay: 0.25 * i, duration: 0.5 }}
            >
              <FloatingArt art={step.art} size={88} className={s.art} delay={i * 0.6} />
              <span className={s.number}>{i + 1}</span>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepText}>{step.text}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}
