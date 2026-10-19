import { CircleCheck } from 'lucide-react'
import { motion } from 'motion/react'
import type { RefObject } from 'react'
import { cn } from '../../../../lib/cn'
import { SignInPanel } from '../../../auth'
import { FloatingArt } from '../FloatingArt'
import { HeroPreview } from '../HeroPreview'
import { heroStyles as s } from './Hero.styles'

const POINTS = ['Free to use', 'No password to remember', 'Works on your phone']

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.5, ease: 'easeOut' as const } }),
}

/** Headline, promise and the sign-up card, beside an animated preview of the app. */
export function Hero({ signUpRef, signUpHighlighted }: { signUpRef: RefObject<HTMLDivElement | null>; signUpHighlighted: boolean }) {
  return (
    <section className={s.root} aria-labelledby="landing-title">
      <div className={s.blobs}>
        <motion.div className={s.blobA} animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className={s.blobB} animate={{ scale: [1.1, 1, 1.1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <div className={s.inner}>
        <div className={s.copy}>
          <motion.span className={s.eyebrow} variants={rise} initial="hidden" animate="show" custom={0}>
            <span className={s.eyebrowDot} />
            For anyone who lends to people they care about
          </motion.span>
          <motion.h1 id="landing-title" className={s.title} variants={rise} initial="hidden" animate="show" custom={1}>
            Lend money. <span className={s.titleAccent}>Keep the friendship.</span>
          </motion.h1>
          <motion.p className={s.lead} variants={rise} initial="hidden" animate="show" custom={2}>
            Lendly keeps track of who owes you what, reminds you before payments are due, and keeps one shared record
            with your partner. No spreadsheets, no awkward chasing.
          </motion.p>
          <motion.ul className={s.points} variants={rise} initial="hidden" animate="show" custom={3}>
            {POINTS.map((point) => (
              <li key={point} className={s.point}>
                <CircleCheck className={s.pointIcon} />
                {point}
              </li>
            ))}
          </motion.ul>

          <motion.div
            ref={signUpRef}
            data-highlighted={signUpHighlighted || undefined}
            className={cn(s.card, signUpHighlighted && s.cardHighlighted)}
            variants={rise}
            initial="hidden"
            animate="show"
            custom={4}
          >
            <FloatingArt art="money-with-wings" size={80} className={s.artPhone} eager />
            <SignInPanel
              title="Get started free"
              intro="Enter your email and we'll send you a sign-in link. New here? That creates your account."
            />
          </motion.div>
        </div>

        <div className={s.previewWrap}>
          <FloatingArt art="money-bag" size={96} className={s.artBag} eager />
          <FloatingArt art="money-with-wings" size={112} className={s.artWings} delay={0.8} eager />
          <FloatingArt art="coin" size={80} className={s.artCoin} delay={1.6} eager />
          <HeroPreview />
        </div>
      </div>
    </section>
  )
}
