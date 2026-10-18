import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { centeredLayoutStyles as s } from './CenteredLayout.styles'

interface CenteredLayoutProps {
  tagline?: string
  footer?: ReactNode
  children: ReactNode
}

/** Branded, centered card used by sign-in and onboarding screens. */
export function CenteredLayout({ tagline = 'Money you lent, sorted.', footer, children }: CenteredLayoutProps) {
  return (
    <div className={s.root}>
      <motion.div className={s.inner} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className={s.brand}>
          <img src="/favicon.svg" alt="" className={s.mark} />
          <div className={s.name}>Lendly</div>
          <div className={s.tagline}>{tagline}</div>
        </div>
        <div className={s.card}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </motion.div>
    </div>
  )
}
