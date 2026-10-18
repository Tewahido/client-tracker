import { LoanDetailModal, LoanFormModal, PaymentFormModal } from '../features/loans'
import { PersonFormModal } from '../features/people'
import { useOverlay, type Overlay } from './overlayContext'

/** Renders every open dialog, bottom of the stack first so the newest sits on top. */
export function OverlayHost() {
  const { stack } = useOverlay()
  return (
    <>
      {stack.map((overlay, index) => (
        <OverlayView key={`${overlay.type}-${index}`} overlay={overlay} />
      ))}
    </>
  )
}

function OverlayView({ overlay }: { overlay: Overlay }) {
  const { open, close, replace } = useOverlay()

  switch (overlay.type) {
    case 'loan-form':
      return (
        <LoanFormModal
          loanId={overlay.loanId}
          borrowerId={overlay.borrowerId}
          onClose={close}
          onSaved={(loan) => (overlay.loanId ? close() : replace({ type: 'loan', loanId: loan.id }))}
        />
      )
    case 'loan':
      return (
        <LoanDetailModal
          loanId={overlay.loanId}
          onClose={close}
          onEdit={() => open({ type: 'loan-form', loanId: overlay.loanId })}
          onRecordPayment={() => open({ type: 'payment', loanId: overlay.loanId })}
          onOpenPerson={(borrowerId) => open({ type: 'person', borrowerId })}
        />
      )
    case 'payment':
      return <PaymentFormModal loanId={overlay.loanId} onClose={close} />
    case 'person-form':
      return (
        <PersonFormModal
          borrowerId={overlay.borrowerId}
          onClose={close}
          onSaved={(b) => (overlay.borrowerId ? close() : replace({ type: 'person', borrowerId: b.id }))}
        />
      )
    default:
      return null
  }
}
