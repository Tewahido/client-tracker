import { useState, type ReactNode } from 'react'
import { Button } from '../Button'
import { Modal } from '../Modal'
import { confirmStyles as s } from './ConfirmDialog.styles'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: () => Promise<unknown> | void
  onClose: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // The store already reported the error; keep the dialog open so the user can retry.
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className={s.message}>{message}</p>
      <div className={s.actions}>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={confirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
