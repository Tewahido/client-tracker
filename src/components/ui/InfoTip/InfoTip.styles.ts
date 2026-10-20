// The visible button is small, but `after:` gives it a 44px tap target.
const trigger =
  "relative inline-flex h-5 w-5 items-center justify-center rounded-full transition after:absolute after:-inset-3 after:content-[''] focus-visible:outline-2 focus-visible:outline-brand-400"

export const infoTipStyles = {
  root: 'relative inline-flex',
  trigger: {
    closed: `${trigger} text-muted hover:text-fg`,
    open: `${trigger} text-brand-600 dark:text-brand-300`,
  },
  icon: 'h-4 w-4',
  // Horizontal position comes from usePopover; the scroll margin clears the phone's bottom nav.
  panel:
    'absolute top-full z-40 mt-2 w-72 max-w-[calc(100vw-1rem)] scroll-mb-28 rounded-2xl border border-line bg-bg p-3 text-left text-xs text-fg shadow-2xl lg:scroll-mb-4',
}
