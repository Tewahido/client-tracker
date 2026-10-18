export const appShellStyles = {
  root: 'min-h-dvh lg:pl-64',

  /* Desktop sidebar */
  sidebar: 'fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg/70 px-4 py-6 backdrop-blur-xl lg:flex',
  brand: 'mb-8 flex items-center gap-3 px-2',
  brandMark: 'h-9 w-9 rounded-xl shadow-lg shadow-brand-500/30',
  brandName: 'text-lg font-extrabold tracking-tight',
  brandTag: 'text-[11px] font-medium text-muted',
  nav: 'flex flex-1 flex-col gap-1',
  navItem:
    'relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg',
  navItemActive: 'text-fg',
  navPill: 'absolute inset-0 rounded-xl bg-surface-2 ring-1 ring-line',
  navIcon: 'relative h-[18px] w-[18px]',
  navLabel: 'relative',
  navBadge: 'relative ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white tabular',
  sidebarFooter: 'flex flex-col gap-3',
  backend: 'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted',
  backendDot: 'h-2 w-2 rounded-full',
  backendLocal: 'bg-amber-400',
  backendCloud: 'bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400',

  /* Mobile top bar */
  topbar:
    'sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/75 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl lg:hidden',
  topbarBrand: 'flex items-center gap-2.5',
  topbarMark: 'h-8 w-8 rounded-lg',
  topbarName: 'text-base font-extrabold tracking-tight',
  topbarActions: 'flex items-center gap-1',

  /* Desktop actions row above page content */
  desktopActions: 'hidden items-center justify-end gap-2 px-8 pt-6 lg:flex',

  main: 'mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 lg:px-8 lg:pt-2 lg:pb-12',

  /* Mobile bottom tab bar */
  tabbar:
    'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden',
  tabbarInner: 'mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2',
  tab: 'flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted transition-colors',
  tabActive: 'text-brand-600 dark:text-brand-300',
  tabIcon: 'h-5 w-5',
  tabIconWrap: 'relative',
  tabDot: 'absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-bg',
  fabSlot: 'flex justify-center',
  fab: 'flex h-14 w-14 -translate-y-4 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-sky-brand text-emerald-950 shadow-xl shadow-brand-500/40 transition active:scale-95',
  fabIcon: 'h-6 w-6',
}
