import { motion } from 'motion/react'
import { cn } from '../../../../lib/cn'
import { floatingArtStyles as s } from './FloatingArt.styles'

export type LandingArt = 'banknotes' | 'bell' | 'coin' | 'money-bag' | 'money-with-wings' | 'party-popper'

interface FloatingArtProps {
  art: LandingArt
  /** Rendered size in px (images are 192px, so up to that stays sharp). */
  size: number
  /** Positioning classes from the parent's styles file. */
  className?: string
  /** Seconds to offset the bobbing, so several pieces don't move in sync. */
  delay?: number
  /** Load immediately (above the fold) instead of lazily. */
  eager?: boolean
}

/** Decorative 3D illustration that gently bobs; still when the user prefers reduced motion. */
export function FloatingArt({ art, size, className, delay = 0, eager }: FloatingArtProps) {
  return (
    <motion.img
      src={`/landing/${art}.webp`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      loading={eager ? 'eager' : 'lazy'}
      draggable={false}
      className={cn(s.base, className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -12, 0], rotate: [-3, 3, -3] }}
      transition={{
        opacity: { duration: 0.6, delay: 0.4 + delay },
        scale: { duration: 0.6, delay: 0.4 + delay },
        y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay },
        rotate: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    />
  )
}
