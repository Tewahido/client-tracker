import { cn } from '../../lib/cn'
import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui'
import { NAV_ITEMS, type RouteName } from '../routes'
import { appShellStyles as s } from './AppShell.styles'

interface AppShellProps {
  current: RouteName
  onNavigate: (route: RouteName) => void
  /** Omitted for read-only users, which hides the New loan buttons. */
  onNewLoan?: () => void
  /** Small count shown on the Loans tab (e.g. overdue loans). */
  loansBadge?: number
  backend: 'local' | 'supabase'
  /** Controls shown in the top bar, such as the notification bell. */
  actions?: ReactNode
  /** Organisation switcher; replaces the storage indicator in the sidebar when present. */
  workspace?: ReactNode
  children: ReactNode
}

function BrandMark({ className }: { className: string }) {
  return <img src="/favicon.svg" alt="" className={className} />
}

export function AppShell({ current, onNavigate, onNewLoan, loansBadge = 0, backend, actions, workspace, children }: AppShellProps) {
  const [first, second, ...rest] = NAV_ITEMS

  return (
    <div className={s.root}>
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <BrandMark className={s.brandMark} />
          <div>
            <div className={s.brandName}>Lendly</div>
            <div className={s.brandTag}>Money you lent, sorted</div>
          </div>
        </div>
        <nav className={s.nav} aria-label="Main">
          {NAV_ITEMS.map(({ name, label, icon: Icon }) => {
            const active = name === current
            return (
              <a
                key={name}
                href={`#${name}`}
                aria-current={active ? 'page' : undefined}
                className={cn(s.navItem, active && s.navItemActive)}
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate(name)
                }}
              >
                {active && <motion.span layoutId="nav-pill" className={s.navPill} transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
                <Icon className={s.navIcon} />
                <span className={s.navLabel}>{label}</span>
                {name === 'loans' && loansBadge > 0 && <span className={s.navBadge}>{loansBadge}</span>}
              </a>
            )
          })}
        </nav>
        <div className={s.sidebarFooter}>
          {onNewLoan && (
            <Button icon={Plus} size="lg" fullWidth onClick={onNewLoan}>
              New loan
            </Button>
          )}
          {workspace ?? (
            <div className={s.backend}>
              <span className={cn(s.backendDot, backend === 'supabase' ? s.backendCloud : s.backendLocal)} />
              {backend === 'supabase' ? 'Synced with Supabase' : 'Saved on this device'}
            </div>
          )}
        </div>
      </aside>

      <header className={s.topbar}>
        <div className={s.topbarBrand}>
          <BrandMark className={s.topbarMark} />
          <span className={s.topbarName}>Lendly</span>
        </div>
        <div className={s.topbarActions}>{actions}</div>
      </header>

      <div className={s.desktopActions}>{actions}</div>

      <main className={s.main}>{children}</main>

      <nav className={s.tabbar} aria-label="Main">
        <div className={s.tabbarInner}>
          {[first, second].map((item) => (
            <TabButton key={item.name} item={item} active={item.name === current} dot={item.name === 'loans' && loansBadge > 0} onNavigate={onNavigate} />
          ))}
          <div className={s.fabSlot}>
            {onNewLoan && (
              <button className={s.fab} onClick={onNewLoan} aria-label="New loan">
                <Plus className={s.fabIcon} strokeWidth={2.5} />
              </button>
            )}
          </div>
          {rest.map((item) => (
            <TabButton key={item.name} item={item} active={item.name === current} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function TabButton({
  item: { name, label, icon: Icon },
  active,
  dot,
  onNavigate,
}: {
  item: (typeof NAV_ITEMS)[number]
  active: boolean
  dot?: boolean
  onNavigate: (route: RouteName) => void
}) {
  return (
    <button className={cn(s.tab, active && s.tabActive)} aria-current={active ? 'page' : undefined} onClick={() => onNavigate(name)}>
      <span className={s.tabIconWrap}>
        <Icon className={s.tabIcon} strokeWidth={active ? 2.4 : 2} />
        {dot && <span className={s.tabDot} />}
      </span>
      {label}
    </button>
  )
}
