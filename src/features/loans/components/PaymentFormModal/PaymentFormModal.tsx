import { Button, Modal, TextInput } from '../../../../components/ui'
import { useMoney } from '../../../../hooks/useMoney'
import { currencySymbol } from '../../../../lib/money'
import { useSettings } from '../../../../providers/settingsContext'
import { usePaymentForm } from '../../hooks/usePaymentForm'
import { paymentFormStyles as s } from './PaymentFormModal.styles'

const SHARES = [
  { label: 'Quarter', value: 0.25 },
  { label: 'Half', value: 0.5 },
  { label: 'Everything', value: 1 },
]

export function PaymentFormModal({ loanId, onClose }: { loanId: string; onClose: () => void }) {
  const { values, errors, submitting, bind, onSubmit, view, balance, setShare } = usePaymentForm(loanId, onClose)
  const { settings } = useSettings()
  const money = useMoney()

  return (
    <Modal
      open
      onClose={onClose}
      title="Record a payment"
      description={view?.borrower ? `${view.borrower.name} still owes ${money(balance)}.` : undefined}
    >
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <TextInput
          label="Amount received"
          inputMode="decimal"
          prefix={currencySymbol(settings.currency)}
          value={values.amount}
          onChange={bind('amount')}
          error={errors.amount}
        />
        <div className={s.shares}>
          {SHARES.map((share) => (
            <button key={share.label} type="button" className={s.share} onClick={() => setShare(share.value)}>
              {share.label}
            </button>
          ))}
        </div>
        <TextInput label="Received on" type="date" value={values.paidOn} onChange={bind('paidOn')} error={errors.paidOn} />
        <TextInput label="Note" value={values.note} onChange={bind('note')} placeholder="e.g. Bank transfer, cash" />
        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
