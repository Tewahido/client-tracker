export const orgSwitcherStyles = {
  root: 'relative',
  trigger:
    'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-brand-400',
  badge:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-sm font-bold text-white',
  info: 'min-w-0 flex-1',
  name: 'block truncate text-sm font-bold',
  sub: 'block truncate text-[11px] text-muted',
  chevron: 'h-4 w-4 shrink-0 text-muted',
  menu: 'absolute inset-x-0 bottom-full z-40 mb-2 overflow-hidden rounded-2xl border border-line bg-bg p-1.5 shadow-2xl',
  menuLabel: 'px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase',
  item: 'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition hover:bg-surface-2',
  itemIcon: 'h-4 w-4 shrink-0 text-muted',
  itemCheck: 'ml-auto h-4 w-4 shrink-0 text-brand-500',
  itemName: 'min-w-0 flex-1 truncate',
  separator: 'my-1.5 h-px bg-line',
  danger: 'text-rose-500',
}
