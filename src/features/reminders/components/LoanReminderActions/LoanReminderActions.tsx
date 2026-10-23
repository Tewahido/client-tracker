import { CalendarPlus } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { isOpen } from '../../../../lib/loans'
import { useLoanStore } from '../../../../providers/loanStoreContext'
import { useCalendarExport } from '../../hooks/useCalendarExport'
import { loanReminderActionsStyles as s } from './LoanReminderActions.styles'

/** Reminder controls shown inside a loan's detail view. */
export function LoanReminderActions({ loanId }: { loanId: string }) {
  const { viewById } = useLoanStore()
  const { exportLoan } = useCalendarExport()
  const view = viewById.get(loanId)
  if (!view || !isOpen(view.status)) return null
  const unpaid = view.plan?.instalments.filter((i) => !i.paidOn).length ?? 0

  return (
    <div className={s.root}>
      <div className={s.text}>
        <div className={s.title}>{unpaid > 1 ? 'Never miss a payment' : 'Never miss the due date'}</div>
        <div className={s.hint}>
          {unpaid > 1
            ? `Adds all ${unpaid} payment dates to your calendar with alerts the day before and on the day.`
            : 'Adds it to your calendar with alerts the day before and on the day.'}
        </div>
      </div>
      <Button variant="secondary" size="sm" icon={CalendarPlus} onClick={() => exportLoan(view)}>
        Add to calendar
      </Button>
    </div>
  )
}
