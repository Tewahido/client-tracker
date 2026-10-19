import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '../../../../components/ui'
import { finalCtaStyles as s } from './FinalCta.styles'

export function FinalCta({ onStart }: { onStart: () => void }) {
  return (
    <section className={s.root} aria-labelledby="cta-title">
      <motion.div
        className={s.card}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <div className={s.glowA} />
        <div className={s.glowB} />
        <div className={s.body}>
          <h2 id="cta-title" className={s.title}>
            Stop keeping score in your head
          </h2>
          <p className={s.text}>Start tracking in under a minute. All you need is your email address.</p>
          <div className={s.action}>
            <Button size="lg" trailingIcon={ArrowRight} onClick={onStart}>
              Get started, it's free
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
