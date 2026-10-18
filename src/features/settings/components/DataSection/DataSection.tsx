import { Database, Download, FileSpreadsheet, Upload } from 'lucide-react'
import { useRef } from 'react'
import { Button, ConfirmDialog } from '../../../../components/ui'
import { useLoanStore } from '../../../../providers/loanStoreContext'
import { useDataTransfer } from '../../hooks/useDataTransfer'
import { SettingsRow, SettingsSection } from '../SettingsSection'
import { dataSectionStyles as s } from './DataSection.styles'

export function DataSection() {
  const { backend } = useLoanStore()
  const { exportCsv, downloadBackup, chooseRestoreFile, pendingRestore, confirmRestore, cancelRestore, isEmpty } = useDataTransfer()
  const fileRef = useRef<HTMLInputElement>(null)

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
      <SettingsRow label="Restore" hint="Replaces everything here with the contents of a backup file.">
        <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>
          Restore…
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className={s.hiddenInput}
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void chooseRestoreFile(file)
            e.target.value = ''
          }}
        />
      </SettingsRow>

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
