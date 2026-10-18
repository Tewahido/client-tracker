export const fileDropZoneStyles = {
  zone:
    'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
  /**
   * One complete set of colours per state. Mixing state classes on top of base colours
   * (e.g. border-line + border-brand-400) lets stylesheet order pick the winner.
   */
  state: {
    idle: 'border-line bg-surface-2/40 hover:border-brand-400/60 hover:bg-brand-400/5',
    dragging: 'scale-[1.01] border-brand-400 bg-brand-400/10 ring-4 ring-brand-400/20',
    disabled: 'border-line bg-surface-2/40 opacity-50',
  },
  iconWrap: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-400/15 text-brand-600 transition-transform dark:text-brand-300',
  iconDragging: 'scale-110',
  icon: 'h-5 w-5',
  title: 'text-sm font-semibold',
  hint: 'text-xs text-muted',
  link: 'font-semibold text-brand-600 underline-offset-4 dark:text-brand-300',
  input: 'sr-only',
}
