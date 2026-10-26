export const searchInputStyles = {
  root: 'relative w-full sm:w-72',
  // z-10: the input's frosted-glass background would otherwise be painted over the icon.
  icon: 'pointer-events-none absolute top-1/2 left-3.5 z-10 h-4 w-4 -translate-y-1/2 text-muted',
  input:
    'glass h-11 w-full rounded-xl pr-9 pl-10 text-sm text-fg outline-none placeholder:text-muted/70 transition focus:border-brand-400/60 focus:ring-4 focus:ring-brand-400/15',
  clear: 'absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg',
  clearIcon: 'h-4 w-4',
}
