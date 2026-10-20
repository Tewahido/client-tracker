import { Copy } from 'lucide-react'
import { Button, Modal } from '../../../../components/ui'
import type { OrgRole } from '../../../../services/organizations'
import { ROLE_LABEL } from '../../roles'
import { inviteSentDialogStyles as s } from './InviteSentDialog.styles'

interface InviteSentDialogProps {
  invite: { email: string; role: OrgRole } | null
  orgName: string
  onCopyLink: () => void
  onClose: () => void
}

/** Shown after an invite is created: what the invited person has to do next. */
export function InviteSentDialog({ invite, orgName, onCopyLink, onClose }: InviteSentDialogProps) {
  return (
    <Modal
      open={!!invite}
      onClose={onClose}
      title="Invite ready"
      description={invite ? `${invite.email} can join ${orgName} as a ${ROLE_LABEL[invite.role]}.` : undefined}
    >
      {invite && (
        <div className={s.content}>
          <ol className={s.steps}>
            <li className={s.step}>
              <span className={s.number}>1</span>
              <div className={s.stepBody}>
                Send them the Lendly link
                <Button variant="secondary" size="sm" icon={Copy} onClick={onCopyLink}>
                  Copy app link
                </Button>
              </div>
            </li>
            <li className={s.step}>
              <span className={s.number}>2</span>
              <div className={s.stepBody}>
                <span>
                  They sign in with <span className={s.strong}>{invite.email}</span>
                </span>
              </div>
            </li>
            <li className={s.step}>
              <span className={s.number}>3</span>
              <div className={s.stepBody}>They accept the invite waiting for them</div>
            </li>
          </ol>
          <p className={s.note}>Lendly doesn&apos;t email invites, so the link needs to come from you.</p>
          <div className={s.actions}>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
