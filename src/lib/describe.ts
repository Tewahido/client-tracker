import { formatDate } from './dates'
import type { LoanView } from './loans'

/** Short, friendly description of where a loan stands, e.g. "Overdue by 3 days". */
export function dueLabel(view: Pick<LoanView, 'status' | 'daysUntilDue' | 'settledOn' | 'nextDueOn'>): string {
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
      return d === 1 ? 'Due tomorrow' : d <= 30 ? `Due in ${d} days` : `Due ${formatDate(view.nextDueOn, 'd MMM yyyy')}`
  }
}

/** "2 weeks", "3 months", "1 year", or "45 days" for a lending period in days. */
export function periodLabel(days: number): string {
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
  if (days % 365 === 0) return unit(days / 365, 'year')
  if (days % 30 === 0) return unit(days / 30, 'month')
  if (days % 7 === 0) return unit(days / 7, 'week')
  return unit(days, 'day')
}
