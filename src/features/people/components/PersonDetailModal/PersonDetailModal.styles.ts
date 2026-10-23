export const personDetailStyles = {
  header: 'flex items-center gap-4',
  identity: 'min-w-0 flex-1',
  name: 'truncate text-xl font-extrabold tracking-tight',
  contacts: 'mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm',
  contact: 'inline-flex items-center gap-1.5 text-muted transition hover:text-brand-500',
  contactIcon: 'h-3.5 w-3.5',
  stats: 'mt-5 grid grid-cols-3 gap-3',
  stat: 'rounded-xl bg-surface-2/60 px-3.5 py-3',
  statLabel: 'text-[11px] font-semibold tracking-wide text-muted uppercase',
  statValue: 'mt-0.5 text-base font-extrabold tabular',
  /** Missed instalments warn; a record of late ones only informs. */
  history: {
    missed:
      'mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-300',
    late: 'mt-4 flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-300',
  },
  historyIcon: 'h-4 w-4 shrink-0',
  notes: 'mt-4 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted whitespace-pre-line',
  section: 'mt-6',
  sectionHead: 'mb-3 flex items-center justify-between',
  sectionTitle: 'text-xs font-semibold tracking-wide text-muted uppercase',
  list: 'flex flex-col gap-2.5',
  empty: 'rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted',
  footer: 'mt-6 flex justify-between gap-2 border-t border-line pt-4',
}
