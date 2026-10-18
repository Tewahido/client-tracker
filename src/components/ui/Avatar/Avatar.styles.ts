export const avatarStyles = {
  base: 'inline-flex shrink-0 items-center justify-center rounded-2xl font-bold text-white shadow-inner select-none',
  size: {
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-16 w-16 text-xl',
  },
  /** Gradient pairs picked deterministically from the person's name. */
  palettes: [
    'bg-gradient-to-br from-emerald-400 to-teal-600',
    'bg-gradient-to-br from-sky-400 to-indigo-600',
    'bg-gradient-to-br from-violet-400 to-fuchsia-600',
    'bg-gradient-to-br from-amber-400 to-orange-600',
    'bg-gradient-to-br from-rose-400 to-pink-600',
    'bg-gradient-to-br from-cyan-400 to-blue-600',
    'bg-gradient-to-br from-lime-400 to-emerald-600',
  ],
}
