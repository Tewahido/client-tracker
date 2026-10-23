/** Calendar date in local time, formatted `YYYY-MM-DD`. */
export type ISODate = string

export interface Borrower {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  createdAt: string
}

export interface Loan {
  id: string
  borrowerId: string
  /** Amount handed over, in minor units (cents) to avoid float drift. */
  principalCents: number
  /** Flat interest as a percentage of the principal (e.g. 10 = 10%). */
  interestRate: number
  lentOn: ISODate
  dueOn: ISODate
  note: string | null
  /** Set when the lender decides to forgive the remaining balance. */
  writtenOffOn: ISODate | null
  /** Number of monthly repayments; null when the loan is repaid in one go. */
  instalmentCount: number | null
  /** Date of the first monthly repayment (`dueOn` is the last); null when repaid in one go. */
  firstDueOn: ISODate | null
  /** Agreed total to repay in cents, set for monthly plans; null derives it from the interest. */
  agreedTotalCents: number | null
  createdAt: string
}

export interface Payment {
  id: string
  loanId: string
  amountCents: number
  paidOn: ISODate
  note: string | null
  createdAt: string
  /** Organisation member who recorded it (Supabase only). */
  createdBy?: string | null
}

export interface Snapshot {
  borrowers: Borrower[]
  loans: Loan[]
  payments: Payment[]
}

export type LoanStatus = 'overdue' | 'due-today' | 'due-soon' | 'active' | 'paid' | 'written-off'

export type NewBorrower = Omit<Borrower, 'id' | 'createdAt'>
export type NewLoan = Omit<Loan, 'id' | 'createdAt' | 'writtenOffOn'>
export type NewPayment = Omit<Payment, 'id' | 'createdAt'>
