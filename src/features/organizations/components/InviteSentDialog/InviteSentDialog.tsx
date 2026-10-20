import { Check, Copy, Share2 } from 'lucide-react'
import { Button, Modal } from '../../../../components/ui'
import type { OrgRole } from '../../../../services/organizations'
import type { ShareInvite } from '../../hooks/useShareInvite'
import { withArticle } from '../../roles'
import { inviteSentDialogStyles as s } from './InviteSentDialog.styles'

interface InviteSentDialogProps {
  open: boolean
  invite: { email: string; role: OrgRole } | null
  orgName: string
  sharing: ShareInvite
  onClose: () => void
}

/** Shown after an invite is created: what the invited person has to do next. */
export function InviteSentDialog({ open, invite, orgName, sharing, onClose }: InviteSentDialogProps) {
  const copied = !!invite && sharing.copiedFor === invite.email

  return (
    <Modal
      open={open && !!invite}
      onClose={onClose}
      title="Invite ready"
      description={invite ? `${invite.email} can join ${orgName} as ${withArticle(invite.role)}.` : undefined}
    >
      {invite && (
        <div className={s.content}>
          <ol className={s.steps}>
            <li className={s.step}>
              <span className={s.number}>1</span>
              <div className={s.stepBody}>
                <span>Send them the invite</span>
                <span className={s.stepHint}>Lendly doesn&apos;t email invites, so it comes from you.</span>
                <Button
                  icon={sharing.canShare ? Share2 : copied ? Check : Copy}
                  className={s.sendButton}
                  onClick={() => sharing.share(invite.email)}
                >
                  {sharing.canShare ? 'Share invite' : copied ? 'Copied' : 'Copy invite message'}
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
              <div className={s.stepBody}>Their invite will be waiting. One tap and they&apos;re in.</div>
            </li>
          </ol>
          <div className={s.actions}>
            <Button variant="secondary" className={s.doneButton} onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
