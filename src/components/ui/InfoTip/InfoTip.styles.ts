export const infoTipStyles = {
  root: 'relative inline-flex',
  trigger: {
    closed:
      'inline-flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:text-fg focus-visible:outline-2 focus-visible:outline-brand-400',
    open: 'inline-flex h-5 w-5 items-center justify-center rounded-full text-brand-600 transition focus-visible:outline-2 focus-visible:outline-brand-400 dark:text-brand-300',
  },
  icon: 'h-4 w-4',
  panel: {
    start:
      'absolute top-full left-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-bg p-3 text-left text-xs text-fg shadow-2xl',
    end: 'absolute top-full right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-bg p-3 text-left text-xs text-fg shadow-2xl',
  },
}
