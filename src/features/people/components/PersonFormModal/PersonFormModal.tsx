import { Button, Modal, TextArea, TextInput } from '../../../../components/ui'
import type { Borrower } from '../../../../lib/types'
import { usePersonForm } from '../../hooks/usePersonForm'
import { personFormStyles as s } from './PersonFormModal.styles'

interface PersonFormModalProps {
  borrowerId?: string
  onClose: () => void
  onSaved: (borrower: Borrower) => void
}

export function PersonFormModal({ borrowerId, onClose, onSaved }: PersonFormModalProps) {
  const { values, errors, submitting, bind, onSubmit, isEdit } = usePersonForm(borrowerId, onSaved)

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit person' : 'Add a person'}
      description={isEdit ? undefined : 'Contact details let you send payment reminders in one tap.'}
    >
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <TextInput label="Name" value={values.name} onChange={bind('name')} error={errors.name} placeholder="e.g. Hana Bekele" autoComplete="off" />
        <div className={s.row}>
          <TextInput
            label="Phone"
            type="tel"
            value={values.phone}
            onChange={bind('phone')}
            error={errors.phone}
            placeholder="+251 91 234 5678"
            hint="Used for WhatsApp and SMS reminders"
          />
          <TextInput label="Email" type="email" value={values.email} onChange={bind('email')} error={errors.email} placeholder="name@example.com" />
        </div>
        <TextArea label="Notes" value={values.notes} onChange={bind('notes')} placeholder="Anything worth remembering" />
        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Save changes' : 'Add person'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
