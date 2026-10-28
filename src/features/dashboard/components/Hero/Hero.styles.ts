export const heroStyles = {
  root: 'relative overflow-hidden rounded-3xl p-6 text-emerald-950 shadow-2xl shadow-brand-500/20 sm:p-8',
  /** Holds bg, pattern and shine, clipped to the card's corners (see clip-corners in index.css). */
  decor: 'clip-corners',
  bg: 'absolute inset-0 bg-gradient-to-br from-brand-300 via-brand-400 to-sky-brand',
  shine: 'absolute -top-24 -right-16 h-64 w-64 rounded-full bg-white/30 blur-3xl',
  pattern:
    'absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,#022c22_1px,transparent_0)] [background-size:18px_18px]',
  content: 'relative',
  greeting: 'text-sm font-semibold text-emerald-950/70',
  label: 'mt-4 text-xs font-bold tracking-widest text-emerald-950/60 uppercase',
  value: 'mt-1 text-4xl font-extrabold tracking-tight tabular sm:text-5xl',
  sub: 'mt-2 text-sm font-medium text-emerald-950/75',
  progressWrap: 'mt-6 max-w-md',
  progressHead: 'mb-1.5 flex justify-between text-xs font-semibold text-emerald-950/70',
  progressTrack: 'h-2.5 overflow-hidden rounded-full bg-emerald-950/15',
  progressFill: 'h-full rounded-full bg-emerald-950/80',
}
