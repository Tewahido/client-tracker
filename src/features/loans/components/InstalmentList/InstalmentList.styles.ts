import type { InstalmentState } from '../../../../lib/instalments'

export const instalmentListStyles = {
  list: 'max-h-80 divide-y divide-line overflow-y-auto rounded-2xl ring-1 ring-line',
  row: 'flex items-center gap-3 bg-surface px-4 py-2.5',
  number: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-muted tabular',
  main: 'min-w-0 flex-1',
  date: 'text-sm font-semibold',
  meta: 'truncate text-xs text-muted tabular',
  state: {
    base: 'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset',
    paid: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300',
    'paid-late': 'bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300',
    missed: 'bg-rose-500/12 text-rose-600 ring-rose-500/25 dark:text-rose-300',
    next: 'bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300',
    upcoming: 'bg-surface-2 text-muted ring-line',
    forgiven: 'bg-slate-500/12 text-slate-600 ring-slate-500/25 dark:text-slate-300',
  } satisfies Record<InstalmentState | 'base', string>,
}
