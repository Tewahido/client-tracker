const panel = 'absolute z-40 overflow-hidden rounded-2xl border border-line bg-bg p-1.5 shadow-2xl'

export const orgMenuStyles = {
  menu: {
    above: `${panel} inset-x-0 bottom-full mb-2`,
    below: `${panel} top-full left-0 mt-2 w-72 max-w-[calc(100vw-2rem)]`,
  },
  label: 'px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase',
  item: 'flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold transition hover:bg-surface-2',
  itemIcon: 'h-4 w-4 shrink-0 text-muted',
  itemCheck: 'ml-auto h-4 w-4 shrink-0 text-brand-500',
  itemName: 'min-w-0 flex-1 truncate',
  count: 'ml-auto shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white',
  separator: 'my-1.5 h-px bg-line',
}
