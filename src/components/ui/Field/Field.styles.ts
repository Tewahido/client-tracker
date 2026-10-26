const control =
  'w-full rounded-xl border border-line bg-surface-2/60 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-brand-400/60 focus:bg-surface focus:ring-4 focus:ring-brand-400/15 aria-[invalid=true]:border-rose-400/70'

export const fieldStyles = {
  root: 'flex flex-col gap-1.5',
  label: 'text-xs font-semibold tracking-wide text-muted',
  labelRow: 'flex items-center gap-1.5',
  hint: 'text-xs text-muted',
  error: 'text-xs font-medium text-rose-500 dark:text-rose-400',
  input: `${control} h-11 px-3.5`,
  textarea: `${control} min-h-20 resize-y px-3.5 py-2.5`,
  select: `${control} h-11 select-chevron pl-3.5`,
  adornmentWrap: 'relative',
  adornment: 'pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-muted',
  withAdornment: 'pl-12',
}
