import type { Borrower, Loan, NewBorrower, NewLoan, NewPayment, Payment, Snapshot } from '../../lib/types'

export type LoanPatch = Partial<Omit<Loan, 'id' | 'createdAt'>>
export type BorrowerPatch = Partial<NewBorrower>

/**
 * Persistence boundary for the app. The UI only talks to this interface, so the
 * backing store (browser storage or Supabase) can be swapped without touching
 * components or hooks.
 */
export interface DataRepository {
  readonly kind: 'local' | 'supabase'
  load(): Promise<Snapshot>

  createBorrower(input: NewBorrower): Promise<Borrower>
  updateBorrower(id: string, patch: BorrowerPatch): Promise<Borrower>
  /** Also removes the borrower's loans and their payments. */
  deleteBorrower(id: string): Promise<void>

  createLoan(input: NewLoan): Promise<Loan>
  updateLoan(id: string, patch: LoanPatch): Promise<Loan>
  /** Also removes the loan's payments. */
  deleteLoan(id: string): Promise<void>

  createPayment(input: NewPayment): Promise<Payment>
  deletePayment(id: string): Promise<void>

  /** Replace every record, used when restoring a backup. */
  replaceAll(snapshot: Snapshot): Promise<void>

  /** Optional live updates (e.g. other organisation members' edits). Returns an unsubscribe function. */
  subscribe?(onChange: () => void): () => void
}
