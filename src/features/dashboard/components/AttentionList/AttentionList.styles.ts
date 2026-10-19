export const attentionListStyles = {
  list: 'flex flex-col',
  row: 'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-2',
  main: 'min-w-0 flex-1',
  name: 'truncate text-sm font-bold',
  due: 'text-xs text-muted',
  dueUrgent: 'font-semibold text-rose-500 dark:text-rose-400',
  amount: 'shrink-0 text-sm font-bold tabular',
  // The due text already says how urgent it is; save room on phones.
  badge: 'hidden sm:inline-flex',
  allClear: 'flex flex-col items-center gap-2 py-8 text-center',
  allClearIcon: 'flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-500',
  allClearSvg: 'h-6 w-6',
  allClearTitle: 'text-sm font-bold',
  allClearText: 'text-xs text-muted',
}
