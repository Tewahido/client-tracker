import { createContext, useContext } from 'react'
import type { LoanView } from '../lib/loans'
import type { Borrower, Loan, NewBorrower, NewLoan, NewPayment, Payment, Snapshot } from '../lib/types'
import type { BorrowerPatch, LoanPatch } from '../services/storage'

export interface LoanStoreValue {
  status: 'loading' | 'ready' | 'error'
  error: string | null
  backend: 'local' | 'supabase'
  borrowers: Borrower[]
  loans: Loan[]
  payments: Payment[]
  /** Every loan joined with its borrower and payments, with balances and status computed. */
  views: LoanView[]
  viewById: Map<string, LoanView>
  borrowerById: Map<string, Borrower>

  reload: () => Promise<void>
  addBorrower: (input: NewBorrower) => Promise<Borrower>
  updateBorrower: (id: string, patch: BorrowerPatch) => Promise<Borrower>
  removeBorrower: (id: string) => Promise<void>
  addLoan: (input: NewLoan) => Promise<Loan>
  updateLoan: (id: string, patch: LoanPatch) => Promise<Loan>
  removeLoan: (id: string) => Promise<void>
  recordPayment: (input: NewPayment) => Promise<Payment>
  removePayment: (id: string) => Promise<void>
  replaceAll: (snapshot: Snapshot) => Promise<void>
}

export const LoanStoreContext = createContext<LoanStoreValue | null>(null)

export function useLoanStore(): LoanStoreValue {
  const ctx = useContext(LoanStoreContext)
  if (!ctx) throw new Error('useLoanStore must be used inside <LoanStoreProvider>')
  return ctx
}
