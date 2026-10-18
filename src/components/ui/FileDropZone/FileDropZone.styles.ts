export const fileDropZoneStyles = {
  zone:
    'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-2/40 px-6 py-8 text-center transition-colors hover:border-brand-400/60 hover:bg-brand-400/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
  dragging: 'border-brand-400 bg-brand-400/10',
  disabled: 'opacity-50 hover:border-line hover:bg-surface-2/40',
  iconWrap: 'flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-400/15 text-brand-600 dark:text-brand-300',
  icon: 'h-5 w-5',
  title: 'text-sm font-semibold',
  hint: 'text-xs text-muted',
  link: 'font-semibold text-brand-600 underline-offset-4 dark:text-brand-300',
  input: 'sr-only',
}
