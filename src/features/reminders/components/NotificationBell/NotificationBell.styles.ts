export const notificationBellStyles = {
  root: 'relative',
  button:
    'relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-brand-400',
  icon: 'h-5 w-5',
  badge:
    'absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-bg tabular',
  panel:
    'absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl',
  head: 'flex items-center justify-between border-b border-line px-4 py-3',
  title: 'text-sm font-bold',
  count: 'text-xs text-muted',
  list: 'max-h-80 overflow-y-auto p-2',
  item: 'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2',
  itemMain: 'min-w-0 flex-1',
  itemName: 'truncate text-sm font-semibold',
  itemDue: 'text-xs text-muted',
  itemDueUrgent: 'font-semibold text-rose-500 dark:text-rose-400',
  itemAmount: 'text-sm font-bold tabular',
  empty: 'px-4 py-8 text-center text-sm text-muted',
  cta: 'flex items-center gap-3 border-t border-line bg-surface-2/50 px-4 py-3',
  ctaText: 'flex-1 text-xs text-muted',
}
