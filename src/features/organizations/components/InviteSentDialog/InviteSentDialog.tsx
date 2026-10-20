import { Check, Copy, Share2 } from 'lucide-react'
import { Button, Modal } from '../../../../components/ui'
import type { SentInvite } from '../../hooks/useInviteForm'
import type { ShareInvite } from '../../hooks/useShareInvite'
import { withArticle } from '../../roles'
import { inviteSentDialogStyles as s } from './InviteSentDialog.styles'

interface InviteSentDialogProps {
  open: boolean
  invite: SentInvite | null
  orgName: string
  sharing: ShareInvite
  onClose: () => void
}

/**
 * Shown after an invite is created. If Lendly emailed it, says so (sharing by hand is a
 * backup); if the email couldn't be sent, sharing the invite becomes the main step.
 */
export function InviteSentDialog({ open, invite, orgName, sharing, onClose }: InviteSentDialogProps) {
  const copied = !!invite && sharing.copiedFor === invite.email
  const emailed = !!invite?.emailed

  const shareButton = invite && (
    <Button
      variant={emailed ? 'secondary' : 'primary'}
      size={emailed ? 'sm' : 'md'}
      icon={sharing.canShare ? Share2 : copied ? Check : Copy}
      className={s.sendButton}
      onClick={() => sharing.share(invite.email)}
    >
      {sharing.canShare ? 'Share invite' : copied ? 'Copied' : 'Copy invite message'}
    </Button>
  )

  return (
    <Modal
      open={open && !!invite}
      onClose={onClose}
      title={emailed ? 'Invite sent' : 'Invite ready'}
      description={
        invite
          ? emailed
            ? `We emailed ${invite.email} a link to join ${orgName} as ${withArticle(invite.role)}.`
            : `${invite.email} can join ${orgName} as ${withArticle(invite.role)}.`
          : undefined
      }
    >
      {invite && (
        <div className={s.content}>
          <ol className={s.steps}>
            {emailed ? (
              <li className={s.step}>
                <span className={s.number}>1</span>
                <div className={s.stepBody}>
                  <span>They open the email from Lendly and sign in</span>
                  <span className={s.stepHint}>Not there? Ask them to check spam, or send it yourself:</span>
                  {shareButton}
                </div>
              </li>
            ) : (
              <>
                <li className={s.step}>
                  <span className={s.number}>1</span>
                  <div className={s.stepBody}>
                    <span>Send them the invite</span>
                    <span className={s.stepHint}>We couldn&apos;t email it, so it comes from you.</span>
                    {shareButton}
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
              </>
            )}
            <li className={s.step}>
              <span className={s.number}>{emailed ? 2 : 3}</span>
              <div className={s.stepBody}>Their invite will be waiting. One tap and they&apos;re in.</div>
            </li>
          </ol>
          <div className={s.actions}>
            <Button variant={emailed ? 'primary' : 'secondary'} className={s.doneButton} onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
