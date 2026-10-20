export const organizationSectionStyles = {
  block: 'flex flex-col gap-3',
  blockTitle: 'text-xs font-semibold tracking-wide text-muted uppercase',
  inline: 'flex items-end gap-2',
  grow: 'flex-1',

  list: 'divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line',
  member: 'flex flex-wrap items-center gap-3 bg-surface px-4 py-3',
  memberMain: 'min-w-0 flex-1',
  memberEmail: 'truncate text-sm font-semibold',
  memberMeta: 'text-xs text-muted',
  you: 'ml-1.5 rounded-md bg-brand-400/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 uppercase dark:text-brand-300',
  role: 'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
  roleOwner: 'bg-violet-500/12 text-violet-600 ring-violet-500/25 dark:text-violet-300',
  roleMember: 'bg-surface-2 text-muted ring-line',
  memberActions: 'flex gap-1',
  roleSelect: 'h-8 rounded-lg border border-line bg-surface-2/60 px-2 text-xs font-semibold text-fg outline-none focus:border-brand-400/60',

  inviteForm: 'grid gap-2 sm:grid-cols-[1fr_9rem_auto] sm:items-end',
  hint: 'text-xs text-muted',
  roleGuide: 'flex flex-col gap-2 leading-relaxed text-muted',
  roleGuideName: 'font-semibold text-fg',

  pending: 'flex items-center gap-2 rounded-xl bg-surface-2/60 py-2 pr-1 pl-3 text-sm',
  pendingIcon: 'h-4 w-4 shrink-0 text-muted',
  pendingMain: 'flex min-w-0 flex-1 flex-col',
  pendingEmail: 'truncate font-medium',
  pendingShareText: 'hidden sm:inline',

  footer: 'flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4',
  footerText: 'text-xs text-muted',
  footerActions: 'flex flex-wrap gap-2',
  strong: 'font-semibold text-fg',
}
