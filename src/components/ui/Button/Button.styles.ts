export const buttonStyles = {
  base: 'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.97] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400',
  variant: {
    primary:
      'bg-gradient-to-br from-brand-400 to-sky-brand text-emerald-950 shadow-lg shadow-brand-500/25 hover:brightness-110 hover:shadow-brand-500/40',
    secondary: 'glass text-fg hover:bg-surface-2',
    ghost: 'text-muted hover:bg-surface-2 hover:text-fg',
    danger: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 dark:text-rose-400',
  },
  size: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  },
  iconOnly: {
    sm: 'h-8 w-8 px-0',
    md: 'h-10 w-10 px-0',
    lg: 'h-12 w-12 px-0',
  },
  icon: 'h-4 w-4 shrink-0',
  spinner: 'h-4 w-4 shrink-0 animate-spin',
  fullWidth: 'w-full',
}
