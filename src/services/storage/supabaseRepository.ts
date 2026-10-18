import type { SupabaseClient } from '@supabase/supabase-js'
import type { Borrower, Loan, Payment } from '../../lib/types'
import type { DataRepository } from './repository'

/* Row shapes as stored in Postgres (snake_case). `user_id` is filled by the database default. */
interface BorrowerRow {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  created_at: string
}

interface LoanRow {
  id: string
  borrower_id: string
  principal_cents: number
  interest_rate: number
  lent_on: string
  due_on: string
  note: string | null
  written_off_on: string | null
  created_at: string
}

interface PaymentRow {
  id: string
  loan_id: string
  amount_cents: number
  paid_on: string
  note: string | null
  created_at: string
}

const toBorrower = (r: BorrowerRow): Borrower => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email,
  notes: r.notes,
  createdAt: r.created_at,
})

const fromBorrower = (b: Partial<Borrower>): Partial<BorrowerRow> =>
  strip({ id: b.id, name: b.name, phone: b.phone, email: b.email, notes: b.notes, created_at: b.createdAt })

const toLoan = (r: LoanRow): Loan => ({
  id: r.id,
  borrowerId: r.borrower_id,
  principalCents: Number(r.principal_cents),
  interestRate: Number(r.interest_rate),
  lentOn: r.lent_on,
  dueOn: r.due_on,
  note: r.note,
  writtenOffOn: r.written_off_on,
  createdAt: r.created_at,
})

const fromLoan = (l: Partial<Loan>): Partial<LoanRow> =>
  strip({
    id: l.id,
    borrower_id: l.borrowerId,
    principal_cents: l.principalCents,
    interest_rate: l.interestRate,
    lent_on: l.lentOn,
    due_on: l.dueOn,
    note: l.note,
    written_off_on: l.writtenOffOn,
    created_at: l.createdAt,
  })

const toPayment = (r: PaymentRow): Payment => ({
  id: r.id,
  loanId: r.loan_id,
  amountCents: Number(r.amount_cents),
  paidOn: r.paid_on,
  note: r.note,
  createdAt: r.created_at,
})

const fromPayment = (p: Partial<Payment>): Partial<PaymentRow> =>
  strip({ id: p.id, loan_id: p.loanId, amount_cents: p.amountCents, paid_on: p.paidOn, note: p.note, created_at: p.createdAt })

/** Drop undefined keys so partial updates don't overwrite columns with null. */
function strip<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

/**
 * Stores data in Supabase. Row Level Security (see supabase/migrations) limits
 * access to allow-listed members, who all share one ledger; no user filter is needed here.
 */
export function createSupabaseRepository(client: SupabaseClient): DataRepository {
  return {
    kind: 'supabase',

    async load() {
      const [borrowers, loans, payments] = await Promise.all([
        client.from('borrowers').select('*').order('created_at'),
        client.from('loans').select('*').order('created_at'),
        client.from('payments').select('*').order('paid_on'),
      ])
      return {
        borrowers: unwrap<BorrowerRow[]>(borrowers).map(toBorrower),
        loans: unwrap<LoanRow[]>(loans).map(toLoan),
        payments: unwrap<PaymentRow[]>(payments).map(toPayment),
      }
    },

    async createBorrower(input) {
      return toBorrower(unwrap(await client.from('borrowers').insert(fromBorrower(input)).select().single()))
    },

    async updateBorrower(id, patch) {
      return toBorrower(unwrap(await client.from('borrowers').update(fromBorrower(patch)).eq('id', id).select().single()))
    },

    async deleteBorrower(id) {
      unwrap(await client.from('borrowers').delete().eq('id', id))
    },

    async createLoan(input) {
      return toLoan(unwrap(await client.from('loans').insert(fromLoan(input)).select().single()))
    },

    async updateLoan(id, patch) {
      return toLoan(unwrap(await client.from('loans').update(fromLoan(patch)).eq('id', id).select().single()))
    },

    async deleteLoan(id) {
      unwrap(await client.from('loans').delete().eq('id', id))
    },

    async createPayment(input) {
      return toPayment(unwrap(await client.from('payments').insert(fromPayment(input)).select().single()))
    },

    async deletePayment(id) {
      unwrap(await client.from('payments').delete().eq('id', id))
    },

    async replaceAll(snapshot) {
      // Borrower deletes cascade to loans and payments.
      unwrap(await client.from('borrowers').delete().not('id', 'is', null))
      if (snapshot.borrowers.length) unwrap(await client.from('borrowers').insert(snapshot.borrowers.map(fromBorrower)))
      if (snapshot.loans.length) unwrap(await client.from('loans').insert(snapshot.loans.map(fromLoan)))
      if (snapshot.payments.length) unwrap(await client.from('payments').insert(snapshot.payments.map(fromPayment)))
    },
  }
}
