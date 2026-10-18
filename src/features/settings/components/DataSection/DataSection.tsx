import { Database, Download, FileSpreadsheet } from 'lucide-react'
import { Button, ConfirmDialog, FileDropZone } from '../../../../components/ui'
import { usePermissions } from '../../../../hooks/usePermissions'
import { useLoanStore } from '../../../../providers/loanStoreContext'
import { useDataTransfer } from '../../hooks/useDataTransfer'
import { SettingsRow, SettingsSection } from '../../../../components/layout/SettingsSection'
import { dataSectionStyles as s } from './DataSection.styles'

export function DataSection() {
  const { backend } = useLoanStore()
  const { exportCsv, downloadBackup, chooseRestoreFile, pendingRestore, confirmRestore, cancelRestore, isEmpty } = useDataTransfer()
  const { isOwner } = usePermissions()

  return (
    <SettingsSection
      icon={Database}
      title="Your data"
      description={
        backend === 'supabase'
          ? 'Stored securely in your organisation and synced across devices.'
          : 'Stored only in this browser. Download a backup now and then so nothing gets lost.'
      }
    >
      <SettingsRow label="Spreadsheet" hint="Every loan with balances, ready for Excel or Google Sheets.">
        <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={exportCsv} disabled={isEmpty}>
          Export CSV
        </Button>
      </SettingsRow>
      <SettingsRow label="Backup" hint="A complete copy you can restore later or on another device.">
        <Button variant="secondary" size="sm" icon={Download} onClick={downloadBackup} disabled={isEmpty}>
          Download
        </Button>
      </SettingsRow>
      <SettingsRow
        label="Restore"
        hint={isOwner ? 'Replaces everything here with the contents of a backup file.' : 'Only organisation owners can restore backups.'}
      />
      <FileDropZone
        label="Restore a backup"
        hint="Lendly .json backup"
        accept="application/json,.json"
        disabled={!isOwner}
        onFile={(file) => void chooseRestoreFile(file)}
      />

      <ConfirmDialog
        open={!!pendingRestore}
        title="Restore this backup?"
        message={
          pendingRestore && (
            <>
              It has <span className={s.strong}>{pendingRestore.data.loans.length} loans</span> and{' '}
              <span className={s.strong}>{pendingRestore.data.borrowers.length} people</span> from{' '}
              {new Date(pendingRestore.exportedAt).toLocaleDateString()}. Everything currently here will be replaced
              {backend === 'supabase' ? ' for everyone in this organisation' : ''}.
            </>
          )
        }
        confirmLabel="Replace and restore"
        danger
        onConfirm={confirmRestore}
        onClose={cancelRestore}
      />
    </SettingsSection>
  )
}
