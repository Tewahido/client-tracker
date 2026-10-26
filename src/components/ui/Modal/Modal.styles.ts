export const modalStyles = {
  overlay: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
  positioner: 'fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6',
  panel:
    'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-bg shadow-2xl sm:rounded-3xl',
  width: {
    normal: 'sm:max-w-lg',
    wide: 'sm:max-w-2xl',
  },
  handle: 'mx-auto mt-3 h-1.5 w-10 rounded-full bg-surface-2 sm:hidden',
  header: 'flex items-start justify-between gap-4 px-6 pt-5 pb-2',
  titleWrap: 'min-w-0',
  title: 'text-lg font-bold tracking-tight',
  description: 'mt-0.5 text-sm text-muted',
  body: 'scrollbar-themed overflow-y-auto px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
}
