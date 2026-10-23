import { withFreshIds, withLoanDefaults } from '../../lib/snapshot'
import type { Snapshot } from '../../lib/types'
import type { DataRepository } from './repository'

const STORAGE_KEY = 'lendly.data.v1'

const empty = (): Snapshot => ({ borrowers: [], loans: [], payments: [] })

function read(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<Snapshot>
    return { borrowers: parsed.borrowers ?? [], loans: (parsed.loans ?? []).map(withLoanDefaults), payments: parsed.payments ?? [] }
  } catch {
    return empty()
  }
}

/** Stores everything in this browser's localStorage. Used when Supabase is not configured. */
export function createLocalRepository(): DataRepository {
  let data = read()

  const commit = (next: Snapshot) => {
    data = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const stamp = () => ({ id: crypto.randomUUID(), createdAt: new Date().toISOString() })

  return {
    kind: 'local',

    async load() {
      data = read()
      return data
    },

    async createBorrower(input) {
      const borrower = { ...input, ...stamp() }
      commit({ ...data, borrowers: [...data.borrowers, borrower] })
      return borrower
    },

    async updateBorrower(id, patch) {
      const current = data.borrowers.find((b) => b.id === id)
      if (!current) throw new Error('Person not found')
      const updated = { ...current, ...patch }
      commit({ ...data, borrowers: data.borrowers.map((b) => (b.id === id ? updated : b)) })
      return updated
    },

    async deleteBorrower(id) {
      const loanIds = new Set(data.loans.filter((l) => l.borrowerId === id).map((l) => l.id))
      commit({
        borrowers: data.borrowers.filter((b) => b.id !== id),
        loans: data.loans.filter((l) => !loanIds.has(l.id)),
        payments: data.payments.filter((p) => !loanIds.has(p.loanId)),
      })
    },

    async createLoan(input) {
      const loan = { ...input, writtenOffOn: null, ...stamp() }
      commit({ ...data, loans: [...data.loans, loan] })
      return loan
    },

    async updateLoan(id, patch) {
      const current = data.loans.find((l) => l.id === id)
      if (!current) throw new Error('Loan not found')
      const updated = { ...current, ...patch }
      commit({ ...data, loans: data.loans.map((l) => (l.id === id ? updated : l)) })
      return updated
    },

    async deleteLoan(id) {
      commit({
        ...data,
        loans: data.loans.filter((l) => l.id !== id),
        payments: data.payments.filter((p) => p.loanId !== id),
      })
    },

    async createPayment(input) {
      const payment = { ...input, ...stamp() }
      commit({ ...data, payments: [...data.payments, payment] })
      return payment
    },

    async deletePayment(id) {
      commit({ ...data, payments: data.payments.filter((p) => p.id !== id) })
    },

    async replaceAll(snapshot) {
      // Fresh ids, like the Supabase restore, so both backends behave the same.
      commit(withFreshIds(snapshot))
    },
  }
}
