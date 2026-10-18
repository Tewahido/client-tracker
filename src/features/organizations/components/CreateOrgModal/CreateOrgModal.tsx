import { Button, Modal, TextInput } from '../../../../components/ui'
import { useCreateOrgForm } from '../../hooks/useCreateOrgForm'
import { createOrgModalStyles as s } from './CreateOrgModal.styles'

export function CreateOrgModal({ onClose }: { onClose: () => void }) {
  const form = useCreateOrgForm(onClose)

  return (
    <Modal open onClose={onClose} title="New organisation" description="A separate set of people and loans you can share with others.">
      <form className={s.form} onSubmit={form.submit} noValidate>
        <TextInput label="Name" value={form.name} onChange={(e) => form.setName(e.target.value)} placeholder="e.g. Side hustle" error={form.error} />
        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={form.busy}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}
