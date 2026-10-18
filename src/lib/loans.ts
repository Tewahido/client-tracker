import { daysBetween } from './dates'
import type { Borrower, ISODate, Loan, LoanStatus, Payment } from './types'

export interface LoanView {
  loan: Loan
  borrower: Borrower | undefined
  payments: Payment[]
  totalDueCents: number
  paidCents: number
  balanceCents: number
  /** 0..1 share of the total that has been repaid. */
  progress: number
  status: LoanStatus
  /** Days until the due date; negative once overdue. */
  daysUntilDue: number
  /** Date the balance reached zero, if it has. */
  settledOn: ISODate | null
}

export function totalDueCents(loan: Pick<Loan, 'principalCents' | 'interestRate'>): number {
  return Math.round(loan.principalCents * (1 + loan.interestRate / 100))
}

export function loanStatus(balanceCents: number, daysUntilDue: number, soonDays: number, writtenOff: boolean): LoanStatus {
  if (balanceCents <= 0) return 'paid'
  if (writtenOff) return 'written-off'
  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue === 0) return 'due-today'
  if (daysUntilDue <= soonDays) return 'due-soon'
  return 'active'
}

/** Sorting weight so the loans needing attention float to the top. */
export const STATUS_PRIORITY: Record<LoanStatus, number> = {
  overdue: 0,
  'due-today': 1,
  'due-soon': 2,
  active: 3,
  paid: 4,
  'written-off': 5,
}

export function isOpen(status: LoanStatus): boolean {
  return status !== 'paid' && status !== 'written-off'
}

export function buildLoanViews(
  loans: Loan[],
  payments: Payment[],
  borrowers: Borrower[],
  todayDate: ISODate,
  soonDays: number,
): LoanView[] {
  const byLoan = new Map<string, Payment[]>()
  for (const p of payments) {
    const list = byLoan.get(p.loanId)
    if (list) list.push(p)
    else byLoan.set(p.loanId, [p])
  }
  const borrowerById = new Map(borrowers.map((b) => [b.id, b]))

  return loans.map((loan) => {
    const loanPayments = (byLoan.get(loan.id) ?? []).sort((a, b) => a.paidOn.localeCompare(b.paidOn))
    const total = totalDueCents(loan)
    const paid = loanPayments.reduce((sum, p) => sum + p.amountCents, 0)
    const balance = Math.max(0, total - paid)
    const daysUntilDue = daysBetween(todayDate, loan.dueOn)

    let settledOn: ISODate | null = null
    if (balance === 0) {
      let running = 0
      for (const p of loanPayments) {
        running += p.amountCents
        if (running >= total) {
          settledOn = p.paidOn
          break
        }
      }
    }

    return {
      loan,
      borrower: borrowerById.get(loan.borrowerId),
      payments: loanPayments,
      totalDueCents: total,
      paidCents: paid,
      balanceCents: balance,
      progress: total === 0 ? 1 : Math.min(1, paid / total),
      status: loanStatus(balance, daysUntilDue, soonDays, loan.writtenOffOn !== null),
      daysUntilDue,
      settledOn,
    }
  })
}

export function sortByUrgency(views: LoanView[]): LoanView[] {
  return [...views].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] || a.loan.dueOn.localeCompare(b.loan.dueOn),
  )
}

export interface PortfolioStats {
  outstandingCents: number
  overdueCents: number
  overdueCount: number
  dueThisWeekCents: number
  dueThisWeekCount: number
  collectedThisMonthCents: number
  totalLentCents: number
  totalCollectedCents: number
  openCount: number
  borrowersWithDebt: number
}

export function portfolioStats(views: LoanView[], payments: Payment[], todayDate: ISODate): PortfolioStats {
  const month = todayDate.slice(0, 7)
  const stats: PortfolioStats = {
    outstandingCents: 0,
    overdueCents: 0,
    overdueCount: 0,
    dueThisWeekCents: 0,
    dueThisWeekCount: 0,
    collectedThisMonthCents: 0,
    totalLentCents: 0,
    totalCollectedCents: 0,
    openCount: 0,
    borrowersWithDebt: 0,
  }
  const debtors = new Set<string>()

  for (const v of views) {
    stats.totalLentCents += v.loan.principalCents
    if (!isOpen(v.status)) continue
    stats.openCount++
    stats.outstandingCents += v.balanceCents
    debtors.add(v.loan.borrowerId)
    if (v.status === 'overdue') {
      stats.overdueCount++
      stats.overdueCents += v.balanceCents
    } else if (v.daysUntilDue <= 7) {
      stats.dueThisWeekCount++
      stats.dueThisWeekCents += v.balanceCents
    }
  }
  for (const p of payments) {
    stats.totalCollectedCents += p.amountCents
    if (p.paidOn.startsWith(month)) stats.collectedThisMonthCents += p.amountCents
  }
  stats.borrowersWithDebt = debtors.size
  return stats
}

export interface BorrowerStats {
  outstandingCents: number
  lentCents: number
  openLoans: number
  settledLoans: number
  /** Share of settled loans repaid on or before the due date; null with no history. */
  onTimeRate: number | null
  nextDue: LoanView | null
}

export function borrowerStats(views: LoanView[]): BorrowerStats {
  let outstanding = 0
  let lent = 0
  let open = 0
  let settled = 0
  let onTime = 0
  let nextDue: LoanView | null = null

  for (const v of views) {
    lent += v.loan.principalCents
    if (isOpen(v.status)) {
      open++
      outstanding += v.balanceCents
      if (!nextDue || v.loan.dueOn < nextDue.loan.dueOn) nextDue = v
    } else if (v.settledOn) {
      settled++
      if (v.settledOn <= v.loan.dueOn) onTime++
    }
  }

  return {
    outstandingCents: outstanding,
    lentCents: lent,
    openLoans: open,
    settledLoans: settled,
    onTimeRate: settled === 0 ? null : onTime / settled,
    nextDue,
  }
}

/** Collected amount per month for the last `months` months, oldest first. */
export function monthlyCollections(payments: Payment[], todayDate: ISODate, months = 6) {
  const [year, month] = todayDate.split('-').map(Number)
  const buckets: { key: string; cents: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, cents: 0 })
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]))
  for (const p of payments) {
    const i = index.get(p.paidOn.slice(0, 7))
    if (i !== undefined) buckets[i].cents += p.amountCents
  }
  return buckets
}
