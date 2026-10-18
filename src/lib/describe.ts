import { formatDate } from './dates'
import type { LoanView } from './loans'

/** Short, friendly description of where a loan stands, e.g. "Overdue by 3 days". */
export function dueLabel(view: Pick<LoanView, 'status' | 'daysUntilDue' | 'settledOn' | 'loan'>): string {
  const { status, daysUntilDue: d } = view
  switch (status) {
    case 'paid':
      return view.settledOn ? `Paid off ${formatDate(view.settledOn, 'd MMM')}` : 'Paid off'
    case 'written-off':
      return 'Forgiven'
    case 'overdue':
      return `Overdue by ${-d} ${d === -1 ? 'day' : 'days'}`
    case 'due-today':
      return 'Due today'
    default:
      return d === 1 ? 'Due tomorrow' : d <= 30 ? `Due in ${d} days` : `Due ${formatDate(view.loan.dueOn, 'd MMM yyyy')}`
  }
}
