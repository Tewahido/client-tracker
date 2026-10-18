import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useToday } from '../hooks/useToday'
import { buildLoanViews } from '../lib/loans'
import type { Snapshot } from '../lib/types'
import { createRepository, type DataRepository } from '../services/storage'
import { LoanStoreContext, type LoanStoreValue } from './loanStoreContext'
import { useSettings } from './settingsContext'

const EMPTY: Snapshot = { borrowers: [], loans: [], payments: [] }

/** Report a failed write to the user, then rethrow so callers (e.g. forms) can stay open. */
async function guard<T>(task: Promise<T>): Promise<T> {
  try {
    return await task
  } catch (err) {
    toast.error('Could not save changes', { description: err instanceof Error ? err.message : String(err) })
    throw err
  }
}

interface LoanStoreProviderProps {
  /** Active organisation, or null for this device's local storage. Key the provider by it so a switch reloads cleanly. */
  orgId: string | null
  children: ReactNode
}

export function LoanStoreProvider({ orgId, children }: LoanStoreProviderProps) {
  const [repo] = useState<DataRepository>(() => createRepository(orgId))
  const [data, setData] = useState<Snapshot>(EMPTY)
  const [status, setStatus] = useState<LoanStoreValue['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const { settings } = useSettings()
  const todayDate = useToday()

  const reload = useCallback(async () => {
    try {
      setData(await repo.load())
      setStatus('ready')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setStatus('error')
    }
  }, [repo])

  useEffect(() => {
    void reload()
  }, [reload])

  // Live updates from other members. Coalesce bursts (e.g. a restore) into one reload.
  useEffect(() => {
    if (!repo.subscribe) return
    let timer: number | undefined
    const unsubscribe = repo.subscribe(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void reload(), 400)
    })
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [repo, reload])

  const actions = useMemo(
    () => ({
      addBorrower: async (input: Parameters<DataRepository['createBorrower']>[0]) => {
        const borrower = await guard(repo.createBorrower(input))
        setData((d) => ({ ...d, borrowers: [...d.borrowers, borrower] }))
        return borrower
      },
      updateBorrower: async (id: string, patch: Parameters<DataRepository['updateBorrower']>[1]) => {
        const borrower = await guard(repo.updateBorrower(id, patch))
        setData((d) => ({ ...d, borrowers: d.borrowers.map((b) => (b.id === id ? borrower : b)) }))
        return borrower
      },
      removeBorrower: async (id: string) => {
        await guard(repo.deleteBorrower(id))
        setData((d) => {
          const loanIds = new Set(d.loans.filter((l) => l.borrowerId === id).map((l) => l.id))
          return {
            borrowers: d.borrowers.filter((b) => b.id !== id),
            loans: d.loans.filter((l) => !loanIds.has(l.id)),
            payments: d.payments.filter((p) => !loanIds.has(p.loanId)),
          }
        })
      },
      addLoan: async (input: Parameters<DataRepository['createLoan']>[0]) => {
        const loan = await guard(repo.createLoan(input))
        setData((d) => ({ ...d, loans: [...d.loans, loan] }))
        return loan
      },
      updateLoan: async (id: string, patch: Parameters<DataRepository['updateLoan']>[1]) => {
        const loan = await guard(repo.updateLoan(id, patch))
        setData((d) => ({ ...d, loans: d.loans.map((l) => (l.id === id ? loan : l)) }))
        return loan
      },
      removeLoan: async (id: string) => {
        await guard(repo.deleteLoan(id))
        setData((d) => ({
          ...d,
          loans: d.loans.filter((l) => l.id !== id),
          payments: d.payments.filter((p) => p.loanId !== id),
        }))
      },
      recordPayment: async (input: Parameters<DataRepository['createPayment']>[0]) => {
        const payment = await guard(repo.createPayment(input))
        setData((d) => ({ ...d, payments: [...d.payments, payment] }))
        return payment
      },
      removePayment: async (id: string) => {
        await guard(repo.deletePayment(id))
        setData((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) }))
      },
      replaceAll: async (snapshot: Snapshot) => {
        await guard(repo.replaceAll(snapshot))
        setData(snapshot)
      },
    }),
    [repo],
  )

  const views = useMemo(
    () => buildLoanViews(data.loans, data.payments, data.borrowers, todayDate, settings.reminderDays),
    [data, todayDate, settings.reminderDays],
  )

  const value = useMemo<LoanStoreValue>(
    () => ({
      status,
      error,
      backend: repo.kind,
      ...data,
      views,
      viewById: new Map(views.map((v) => [v.loan.id, v])),
      borrowerById: new Map(data.borrowers.map((b) => [b.id, b])),
      reload,
      ...actions,
    }),
    [status, error, repo.kind, data, views, reload, actions],
  )

  return <LoanStoreContext.Provider value={value}>{children}</LoanStoreContext.Provider>
}
