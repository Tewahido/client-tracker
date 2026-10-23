import type { Loan, Snapshot } from './types'

/** Fill in fields added after a loan was saved (monthly plans), so older data reads as once-off loans. */
export function withLoanDefaults(loan: Partial<Loan>): Loan {
  return { instalmentCount: null, firstDueOn: null, agreedTotalCents: null, ...loan } as Loan
}

/** Copy of a snapshot with new ids everywhere, keeping loan/payment references intact. */
export function withFreshIds(snapshot: Snapshot, makeId: () => string = () => crypto.randomUUID()): Snapshot {
  const borrowerIds = new Map(snapshot.borrowers.map((b) => [b.id, makeId()]))
  // Drop orphans first so their payments are dropped too.
  const loans = snapshot.loans.filter((l) => borrowerIds.has(l.borrowerId))
  const loanIds = new Map(loans.map((l) => [l.id, makeId()]))
  const payments = snapshot.payments.filter((p) => loanIds.has(p.loanId))

  return {
    borrowers: snapshot.borrowers.map((b) => ({ ...b, id: borrowerIds.get(b.id)! })),
    loans: loans.map((l) => ({ ...l, id: loanIds.get(l.id)!, borrowerId: borrowerIds.get(l.borrowerId)! })),
    payments: payments.map((p) => ({ ...p, id: makeId(), loanId: loanIds.get(p.loanId)! })),
  }
}
