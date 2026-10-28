export const orgSwitcherStyles = {
  root: 'relative',
  trigger:
    'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand-400',
  badge:
    'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-sm font-bold text-white',
  info: 'min-w-0 flex-1',
  name: 'block truncate text-sm font-bold',
  sub: 'block truncate text-[11px] text-muted',
  chevron: 'h-4 w-4 shrink-0 text-muted',
  /** Sign out, shown inside the shared organisation menu. */
  item: 'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition hover:bg-surface-2',
  itemIcon: 'h-4 w-4 shrink-0 text-muted',
  danger: 'text-rose-500',
  dot: 'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-bg',
}
