export const heroStyles = {
  root: 'relative overflow-hidden',
  blobs: 'pointer-events-none absolute inset-0 -z-10',
  blobA: 'absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-400/25 blur-3xl',
  blobB: 'absolute top-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl',
  inner: 'mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-16',
  copy: 'relative flex flex-col gap-6',
  eyebrow:
    'inline-flex w-fit items-center gap-2 rounded-full bg-brand-400/12 px-3 py-1 text-xs font-bold tracking-wide text-brand-600 ring-1 ring-brand-400/30 ring-inset dark:text-brand-300',
  eyebrowDot: 'h-1.5 w-1.5 rounded-full bg-brand-500',
  title: 'text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl',
  titleAccent: 'text-gradient',
  lead: 'max-w-xl text-base text-balance text-muted sm:text-lg',
  points: 'flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold',
  point: 'inline-flex items-center gap-1.5',
  pointIcon: 'h-4 w-4 text-brand-500',
  // scroll-mt clears the sticky nav (64px) with room to spare when CTAs scroll here.
  card: 'glass relative max-w-md scroll-mt-24 rounded-3xl p-6 shadow-2xl shadow-black/10 ring-1 ring-brand-400/20 transition-shadow duration-500 sm:p-8',
  cardHighlighted: 'ring-4 ring-brand-400/70 shadow-brand-500/40',
  previewWrap: 'relative hidden lg:block',
  artBag: 'absolute -top-16 -left-6 z-10 w-24',
  artWings: 'absolute -top-20 right-2 z-10 w-28',
  artCoin: 'absolute -bottom-20 left-10 z-10 w-20',
  /** Perched on the sign-up card's corner on phones and tablets, clear of the headline. */
  artPhone: 'absolute -top-10 -right-2 w-16 sm:w-20 lg:hidden',
}
