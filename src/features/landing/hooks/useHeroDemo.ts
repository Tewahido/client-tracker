import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

/**
 * Drives the hero's live-looking preview: progress rings fill and a reminder toast
 * appears shortly after load. With reduced motion everything shows in its final state.
 */
export function useHeroDemo() {
  const reduce = useReducedMotion()
  const [started, setStarted] = useState(!!reduce)

  useEffect(() => {
    if (reduce) return
    const timer = window.setTimeout(() => setStarted(true), 600)
    return () => window.clearTimeout(timer)
  }, [reduce])

  return {
    /** Repayment progress of the two sample loans. */
    progress: started ? [0.62, 1] : [0, 0],
    showReminder: started,
  }
}
