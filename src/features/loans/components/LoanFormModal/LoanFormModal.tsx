import { Button, Modal, SelectInput, TextArea, TextInput } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { currencySymbol } from '../../../../lib/money'
import type { Loan } from '../../../../lib/types'
import { useSettings } from '../../../../providers/settingsContext'
import { DUE_PRESETS, NEW_BORROWER, useLoanForm } from '../../hooks/useLoanForm'
import { loanFormStyles as s } from './LoanFormModal.styles'

interface LoanFormModalProps {
  loanId?: string
  borrowerId?: string
  onClose: () => void
  onSaved: (loan: Loan) => void
}

export function LoanFormModal({ loanId, borrowerId, onClose, onSaved }: LoanFormModalProps) {
  const { values, errors, submitting, bind, onSubmit, isEdit, borrowers, applyDuePreset, preview } = useLoanForm({ loanId, borrowerId }, onSaved)
  const { settings } = useSettings()
  const money = useMoney()

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit loan' : 'New loan'} description={isEdit ? undefined : 'Record money you lent and when it should come back.'}>
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <SelectInput label="Lent to" value={values.borrowerId} onChange={bind('borrowerId')} error={errors.borrowerId}>
          <option value="" disabled>
            Choose a person…
          </option>
          {borrowers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
          <option value={NEW_BORROWER}>+ Someone new</option>
        </SelectInput>

        {values.borrowerId === NEW_BORROWER && (
          <TextInput label="Their name" value={values.newBorrowerName} onChange={bind('newBorrowerName')} error={errors.newBorrowerName} placeholder="e.g. Dawit" autoFocus />
        )}

        <div className={s.amountRow}>
          <TextInput
            label="Amount"
            inputMode="decimal"
            prefix={currencySymbol(settings.currency)}
            value={values.amount}
            onChange={bind('amount')}
            error={errors.amount}
            placeholder="0.00"
          />
          <TextInput label="Interest %" inputMode="decimal" value={values.interestRate} onChange={bind('interestRate')} error={errors.interestRate} placeholder="0" />
        </div>

        {preview !== null && (
          <div className={s.previewBox}>
            <span className={s.previewLabel}>They'll pay back</span>
            <span className={s.previewValue}>{money(preview)}</span>
          </div>
        )}

        <div className={s.row}>
          <TextInput label="Lent on" type="date" value={values.lentOn} onChange={bind('lentOn')} error={errors.lentOn} />
          <TextInput label="Due on" type="date" value={values.dueOn} onChange={bind('dueOn')} error={errors.dueOn} />
        </div>
        <div className={s.presets}>
          {DUE_PRESETS.map((p) => (
            <button key={p.days} type="button" className={s.preset} onClick={() => applyDuePreset(p.days)}>
              +{p.label}
            </button>
          ))}
        </div>

        <TextArea label="Note" value={values.note} onChange={bind('note')} placeholder="What was it for? Any terms you agreed on?" />

        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Save changes' : 'Add loan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
