export const loanDetailStyles = {
  who: 'mb-5 flex items-center gap-3',
  whoButton: 'flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:opacity-80',
  whoText: 'min-w-0',
  whoName: 'truncate font-bold',
  whoSub: 'text-xs text-muted',

  hero: 'flex items-center gap-5 rounded-2xl bg-gradient-to-br from-surface-2 to-transparent p-5 ring-1 ring-line',
  heroLabel: 'text-xs font-semibold tracking-wide text-muted uppercase',
  heroValue: 'mt-1 text-3xl font-extrabold tracking-tight tabular',
  heroValueDone: 'text-emerald-600 dark:text-emerald-300',
  heroSub: 'mt-1 text-sm text-muted tabular',

  facts: 'mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4',
  fact: 'rounded-xl bg-surface-2/60 px-3.5 py-3',
  factLabel: 'text-[11px] font-semibold tracking-wide text-muted uppercase',
  factValue: 'mt-0.5 text-sm font-bold tabular',
  factSub: 'mt-0.5 text-[11px] font-semibold text-muted',
  factUrgent: 'text-rose-500 dark:text-rose-400',

  note: 'mt-4 rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted',

  primaryActions: 'mt-5 grid gap-2 sm:grid-cols-2',
  section: 'mt-6',
  sectionTitle: 'mb-2 text-xs font-semibold tracking-wide text-muted uppercase',
  chips: 'flex flex-wrap gap-2',

  payments: 'divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line',
  payment: 'flex items-center gap-3 bg-surface px-4 py-3',
  paymentIcon: 'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  paymentIconSvg: 'h-4 w-4',
  paymentMain: 'min-w-0 flex-1',
  paymentAmount: 'text-sm font-bold tabular',
  paymentMeta: 'truncate text-xs text-muted',
  noPayments: 'rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted',

  footer: 'mt-6 flex flex-wrap justify-between gap-2 border-t border-line pt-4',
  footerGroup: 'flex flex-wrap gap-2',
}
