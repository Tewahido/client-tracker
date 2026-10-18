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

  const toEvent = useCallback(
    (v: LoanView): CalendarEvent => {
      const name = v.borrower?.name ?? 'someone'
      return {
        uid: `${v.loan.id}-${v.loan.dueOn}`,
        date: v.loan.dueOn,
        title: `Collect ${money(v.balanceCents)} from ${name}`,
        description: [
          `Lent ${money(v.loan.principalCents)} on ${formatDate(v.loan.lentOn)}.`,
          `Balance when exported: ${money(v.balanceCents)} of ${money(v.totalDueCents)}.`,
          v.loan.note ? `Note: ${v.loan.note}` : '',
          'Open Lendly to record a payment.',
        ]
          .filter(Boolean)
          .join('\n'),
      }
    },
    [money],
  )

  const exportLoan = useCallback(
    (view: LoanView) => {
      const slug = (view.borrower?.name ?? 'loan').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      downloadFile(`lendly-${slug}-${view.loan.dueOn}.ics`, buildCalendar([toEvent(view)]), 'text/calendar')
      toast.success('Calendar file downloaded', { description: 'Open it to add the due date with reminders.' })
    },
    [toEvent],
  )

  const exportAllOpen = useCallback(() => {
    const open = views.filter((v) => isOpen(v.status))
    if (open.length === 0) {
      toast('No open loans to export')
      return
    }
    downloadFile('lendly-due-dates.ics', buildCalendar(open.map(toEvent)), 'text/calendar')
    toast.success(`Exported ${open.length} due ${open.length === 1 ? 'date' : 'dates'}`, {
      description: 'Open the file to add them to your calendar.',
    })
  }, [views, toEvent])

  return { exportLoan, exportAllOpen }
}
