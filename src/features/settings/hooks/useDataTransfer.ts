import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { parseBackup, serializeBackup, type Backup } from '../../../lib/backup'
import { toCsv } from '../../../lib/csv'
import { today } from '../../../lib/dates'
import { sortByUrgency } from '../../../lib/loans'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { useSettings } from '../../../providers/settingsContext'
import { STATUS_META } from '../../../components/ui'
import { downloadFile } from '../../../services/download'

const amount = (cents: number) => (cents / 100).toFixed(2)

/** Spreadsheet export, full JSON backup, and restore with a confirmation step. */
export function useDataTransfer() {
  const { borrowers, loans, payments, views, replaceAll } = useLoanStore()
  const { settings } = useSettings()
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null)

  const exportCsv = useCallback(() => {
    const rows = sortByUrgency(views).map((v) => [
      v.borrower?.name ?? '',
      v.borrower?.phone ?? '',
      STATUS_META[v.status].label,
      amount(v.loan.principalCents),
      v.loan.interestRate,
      amount(v.totalDueCents),
      amount(v.paidCents),
      amount(v.balanceCents),
      v.loan.lentOn,
      v.loan.dueOn,
      v.settledOn ?? '',
      v.loan.note ?? '',
    ])
    const csv = toCsv(
      ['Person', 'Phone', 'Status', `Lent (${settings.currency})`, 'Interest %', 'Total due', 'Paid', 'Balance', 'Lent on', 'Due on', 'Paid off on', 'Note'],
      rows,
    )
    downloadFile(`lendly-loans-${today()}.csv`, csv, 'text/csv')
    toast.success('Spreadsheet downloaded')
  }, [views, settings.currency])

  const downloadBackup = useCallback(() => {
    downloadFile(`lendly-backup-${today()}.json`, serializeBackup({ borrowers, loans, payments }), 'application/json')
    toast.success('Backup downloaded', { description: 'Keep it somewhere safe.' })
  }, [borrowers, loans, payments])

  /** Validate the chosen file; the actual restore waits for confirmRestore(). */
  const chooseRestoreFile = useCallback(async (file: File) => {
    try {
      setPendingRestore(parseBackup(await file.text()))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that file')
    }
  }, [])

  const confirmRestore = useCallback(async () => {
    if (!pendingRestore) return
    await replaceAll(pendingRestore.data)
    toast.success('Backup restored', {
      description: `${pendingRestore.data.loans.length} loans and ${pendingRestore.data.borrowers.length} people.`,
    })
  }, [pendingRestore, replaceAll])

  return {
    exportCsv,
    downloadBackup,
    chooseRestoreFile,
    pendingRestore,
    confirmRestore,
    cancelRestore: () => setPendingRestore(null),
    isEmpty: loans.length === 0 && borrowers.length === 0,
  }
}
