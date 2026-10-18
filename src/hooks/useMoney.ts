import { useCallback } from 'react'
import { formatMoney } from '../lib/money'
import { useSettings } from '../providers/settingsContext'

/** Money formatter bound to the user's chosen currency. */
export function useMoney() {
  const { settings } = useSettings()
  return useCallback(
    (cents: number, options?: { compact?: boolean }) => formatMoney(cents, settings.currency, options),
    [settings.currency],
  )
}
