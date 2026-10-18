import { HandCoins, LayoutDashboard, Settings, Users, type LucideIcon } from 'lucide-react'

export type RouteName = 'home' | 'loans' | 'people' | 'settings'

export interface Route {
  name: RouteName
  params: URLSearchParams
}

export const NAV_ITEMS: { name: RouteName; label: string; icon: LucideIcon }[] = [
  { name: 'home', label: 'Home', icon: LayoutDashboard },
  { name: 'loans', label: 'Loans', icon: HandCoins },
  { name: 'people', label: 'People', icon: Users },
  { name: 'settings', label: 'Settings', icon: Settings },
]

const NAMES = new Set<string>(NAV_ITEMS.map((n) => n.name))

/** `#loans?status=overdue` -> { name: 'loans', params: status=overdue } */
export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  return { name: NAMES.has(path) ? (path as RouteName) : 'home', params: new URLSearchParams(query) }
}

export function buildHash(name: RouteName, params?: Record<string, string>): string {
  const query = params ? new URLSearchParams(params).toString() : ''
  return `#${name}${query ? `?${query}` : ''}`
}
