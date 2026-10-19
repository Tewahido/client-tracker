import { format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { useToday } from '../../../hooks/useToday'
import { attentionList, isOpen, monthlyCollections, portfolioStats, sortByUrgency } from '../../../lib/loans'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { useSettings } from '../../../providers/settingsContext'

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Everything the home screen shows, derived from the store in one place. */
export function useDashboard() {
  const { views, payments, borrowerById, viewById, status } = useLoanStore()
  const { settings } = useSettings()
  const todayDate = useToday()

  return useMemo(() => {
    const stats = portfolioStats(views, payments, todayDate)
    const urgent = attentionList(views)
    const upcoming = sortByUrgency(views.filter((v) => v.status === 'active' && v.daysUntilDue <= 30))

    const recentPayments = [...payments]
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map((payment) => {
        const view = viewById.get(payment.loanId)
        return { payment, borrower: view ? borrowerById.get(view.loan.borrowerId) : undefined }
      })

    const chart = monthlyCollections(payments, todayDate, 6).map((b) => ({
      key: b.key,
      label: format(parseISO(`${b.key}-01`), 'MMM'),
      fullLabel: format(parseISO(`${b.key}-01`), 'MMMM yyyy'),
      cents: b.cents,
    }))

    // Share of everything ever owed (principal + interest) that has come back.
    const owedEver = views.reduce((sum, v) => sum + (v.status === 'written-off' ? v.paidCents : v.totalDueCents), 0)
    const recoveryRate = owedEver === 0 ? 0 : stats.totalCollectedCents / owedEver

    return {
      ready: status === 'ready',
      hasLoans: views.length > 0,
      greeting: `${greeting(new Date().getHours())}${settings.lenderName ? `, ${settings.lenderName.split(' ')[0]}` : ''}`,
      stats,
      recoveryRate,
      attention: [...urgent, ...upcoming].slice(0, 6),
      urgentCount: urgent.length,
      openCount: views.filter((v) => isOpen(v.status)).length,
      recentPayments,
      chart,
    }
  }, [views, payments, borrowerById, viewById, status, settings.lenderName, todayDate])
}
