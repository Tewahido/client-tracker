import { useCallback } from 'react'
import { formatMoney } from '../lib/money'
import { useLendingDefaults } from './useLendingDefaults'

/** Money formatter bound to the organisation's (or, locally, this device's) currency. */
export function useMoney() {
  const { defaults } = useLendingDefaults()
  const { currency } = defaults
  return useCallback((cents: number, options?: { compact?: boolean }) => formatMoney(cents, currency, options), [currency])
}
