import confetti from 'canvas-confetti'

/** A short burst of confetti, skipped for users who prefer reduced motion. */
export function celebrate(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = ['#34d399', '#22d3ee', '#a78bfa', '#fbbf24']
  void confetti({ particleCount: 90, spread: 75, origin: { y: 0.7 }, colors, disableForReducedMotion: true })
  window.setTimeout(() => void confetti({ particleCount: 50, spread: 110, origin: { y: 0.6 }, colors }), 180)
}
