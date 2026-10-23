import { useCallback } from 'react'
import { toast } from 'sonner'
import { useMoney } from '../../../hooks/useMoney'
import { formatDate } from '../../../lib/dates'
import { buildCalendar, type CalendarEvent } from '../../../lib/ics'
import { isOpen, type LoanView } from '../../../lib/loans'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { downloadFile } from '../../../services/download'

/**
 * Export due dates to the user's own calendar. Calendar alarms fire even when the
 * app is closed, so this is the dependable reminder channel on any device.
 */
export function useCalendarExport() {
  const { views } = useLoanStore()
  const money = useMoney()

  /** One event for a once-off loan; one per unpaid instalment for a monthly plan. */
  const toEvents = useCallback(
    (v: LoanView): CalendarEvent[] => {
      const name = v.borrower?.name ?? 'someone'
      const details = (extra: string) =>
        [
          `Lent ${money(v.loan.principalCents)} on ${formatDate(v.loan.lentOn)}.`,
          extra,
          `Balance when exported: ${money(v.balanceCents)} of ${money(v.totalDueCents)}.`,
          v.loan.note ? `Note: ${v.loan.note}` : '',
          'Open Lendly to record a payment.',
        ]
          .filter(Boolean)
          .join('\n')

      if (!v.plan) {
        return [{ uid: `${v.loan.id}-${v.loan.dueOn}`, date: v.loan.dueOn, title: `Collect ${money(v.balanceCents)} from ${name}`, description: details('') }]
      }
      const count = v.plan.instalments.length
      return v.plan.instalments
        .filter((i) => !i.paidOn)
        .map((i) => ({
          uid: `${v.loan.id}-${i.number}`,
          date: i.dueOn,
          title: `Collect ${money(i.amountCents - i.paidCents)} from ${name} (${i.number} of ${count})`,
          description: details(`Instalment ${i.number} of ${count}${i.state === 'missed' ? ', already missed' : ''}.`),
        }))
    },
    [money],
  )

  const exportLoan = useCallback(
    (view: LoanView) => {
      const slug = (view.borrower?.name ?? 'loan').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const events = toEvents(view)
      downloadFile(`lendly-${slug}-${view.nextDueOn}.ics`, buildCalendar(events), 'text/calendar')
      toast.success('Calendar file downloaded', {
        description: events.length > 1 ? `Open it to add ${events.length} payment dates with reminders.` : 'Open it to add the due date with reminders.',
      })
    },
    [toEvents],
  )

  const exportAllOpen = useCallback(() => {
    const open = views.filter((v) => isOpen(v.status))
    if (open.length === 0) {
      toast('No open loans to export')
      return
    }
    const events = open.flatMap(toEvents)
    downloadFile('lendly-due-dates.ics', buildCalendar(events), 'text/calendar')
    toast.success(`Exported ${events.length} due ${events.length === 1 ? 'date' : 'dates'}`, {
      description: 'Open the file to add them to your calendar.',
    })
  }, [views, toEvents])

  return { exportLoan, exportAllOpen }
}
