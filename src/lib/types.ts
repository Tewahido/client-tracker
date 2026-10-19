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
