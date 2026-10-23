import { Button, Modal, SegmentedControl, SelectInput, TextArea, TextInput } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { formatDate } from '../../../../lib/dates'
import { currencySymbol } from '../../../../lib/money'
import type { Loan } from '../../../../lib/types'
import { useLendingDefaults } from '../../../../hooks/useLendingDefaults'
import { DUE_PRESETS, NEW_BORROWER, REPAYMENT_OPTIONS, useLoanForm } from '../../hooks/useLoanForm'
import { loanFormStyles as s } from './LoanFormModal.styles'

interface LoanFormModalProps {
  loanId?: string
  borrowerId?: string
  onClose: () => void
  onSaved: (loan: Loan) => void
}

export function LoanFormModal({ loanId, borrowerId, onClose, onSaved }: LoanFormModalProps) {
  const { values, errors, submitting, bind, bindPlan, setRepayment, onLentOnChange, onSubmit, isEdit, borrowers, applyDuePreset, preview } = useLoanForm(
    { loanId, borrowerId },
    onSaved,
  )
  const { defaults } = useLendingDefaults()
  const money = useMoney()
  const symbol = currencySymbol(defaults.currency)
  const monthly = values.repayment === 'monthly'

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit loan' : 'New loan'} description={isEdit ? undefined : 'Record money you lent and how it comes back.'}>
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
          <TextInput label="Their name" value={values.newBorrowerName} onChange={bind('newBorrowerName')} error={errors.newBorrowerName} placeholder="e.g. Sipho" autoFocus />
        )}

        <div className={s.amountRow}>
          <TextInput label="Amount" inputMode="decimal" prefix={symbol} value={values.amount} onChange={bindPlan('amount')} error={errors.amount} placeholder="0.00" />
          <TextInput label="Interest %" inputMode="decimal" value={values.interestRate} onChange={bindPlan('interestRate')} error={errors.interestRate} placeholder="0" />
        </div>

        <div className={s.repayment}>
          <span className={s.repaymentLabel}>Paid back</span>
          <SegmentedControl kind="radio" label="Paid back" options={REPAYMENT_OPTIONS} value={values.repayment} onChange={setRepayment} />
        </div>

        {monthly ? (
          <>
            <div className={s.planRow}>
              <TextInput label="Months" inputMode="numeric" value={values.months} onChange={bindPlan('months')} error={errors.months} placeholder="12" />
              <TextInput label="Each month" inputMode="decimal" prefix={symbol} value={values.monthly} onChange={bindPlan('monthly')} error={errors.monthly} placeholder="0.00" />
              <TextInput
                label="Total to pay back"
                className={s.planTotal}
                inputMode="decimal"
                prefix={symbol}
                value={values.total}
                onChange={bindPlan('total')}
                error={errors.total}
                placeholder="0.00"
              />
            </div>
            <div className={s.row}>
              <TextInput label="Lent on" type="date" value={values.lentOn} onChange={onLentOnChange} error={errors.lentOn} />
              <TextInput label="First payment" type="date" value={values.firstDueOn} onChange={bind('firstDueOn')} error={errors.firstDueOn} />
            </div>
          </>
        ) : (
          <>
            <div className={s.row}>
              <TextInput label="Lent on" type="date" value={values.lentOn} onChange={onLentOnChange} error={errors.lentOn} />
              <TextInput label="Due on" type="date" value={values.dueOn} onChange={bind('dueOn')} error={errors.dueOn} />
            </div>
            <div className={s.presets}>
              {DUE_PRESETS.map((p) => (
                <button key={p.days} type="button" className={s.preset} onClick={() => applyDuePreset(p.days)}>
                  +{p.label}
                </button>
              ))}
            </div>
          </>
        )}

        {preview?.kind === 'once' && (
          <div className={s.previewBox}>
            <span className={s.previewLabel}>They'll pay back</span>
            <span className={s.previewValue}>{money(preview.totalCents)}</span>
          </div>
        )}
        {preview?.kind === 'monthly' && (
          <div className={s.previewBox} aria-live="polite">
            <div>
              <div className={s.previewValue}>
                {preview.lastCents === preview.regularCents
                  ? `${preview.months} payments of ${money(preview.regularCents)}`
                  : `${preview.months - 1} payments of ${money(preview.regularCents)}, then ${money(preview.lastCents)}`}
              </div>
              <div className={s.previewLabel}>
                Last one on {formatDate(preview.lastOn)}
                {preview.interestCents > 0 && ` · ${money(preview.interestCents)} interest`}
              </div>
            </div>
          </div>
        )}

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
