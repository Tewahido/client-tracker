export const landingNavStyles = {
  root: 'sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-xl',
  inner: 'mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6',
  brand: 'flex items-center gap-2.5',
  mark: 'h-8 w-8 rounded-lg shadow-lg shadow-brand-500/30',
  name: 'text-lg font-extrabold tracking-tight',
  links: 'hidden items-center gap-1 md:flex',
  link: 'rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg',
  actions: 'flex items-center gap-2',
  /** 44px tall on phones (touch target), compact from sm up. */
  signIn: 'h-11 px-4 text-sm sm:h-8 sm:px-3 sm:text-xs',
}
