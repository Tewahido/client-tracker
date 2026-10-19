import { useCallback, useMemo } from 'react'
import { useSettings } from '../providers/settingsContext'
import { useWorkspace } from '../providers/workspaceContext'
import type { LendingDefaults } from '../services/organizations'
import { usePermissions } from './usePermissions'

/**
 * Currency, default lending period and default interest for new loans. Owned by
 * the active organisation (owners change them for everyone); in local-only mode
 * they are this device's settings.
 */
export function useLendingDefaults() {
  const { activeOrg, service, refresh } = useWorkspace()
  const { settings, updateSettings } = useSettings()
  const { isOwner } = usePermissions()
  const org = service && activeOrg ? activeOrg : null

  const defaults = useMemo<LendingDefaults>(
    () =>
      org
        ? org.defaults
        : { currency: settings.currency, termDays: settings.defaultTermDays, interestRate: settings.defaultInterestRate },
    [org, settings.currency, settings.defaultTermDays, settings.defaultInterestRate],
  )

  const save = useCallback(
    async (next: LendingDefaults) => {
      if (org && service) {
        await service.updateDefaults(org.id, next)
        await refresh()
      } else {
        updateSettings({ currency: next.currency, defaultTermDays: next.termDays, defaultInterestRate: next.interestRate })
      }
    },
    [org, service, refresh, updateSettings],
  )

  return { defaults, scope: org ? ('organisation' as const) : ('device' as const), canChange: isOwner, save }
}
