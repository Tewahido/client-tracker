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

/** Why the owner has to send the invite themselves, when Lendly didn't email it. */
const NOT_EMAILED_HINT = {
  'rate-limited': "We've emailed this address or sent lots of invites recently, so this one comes from you.",
  failed: "We couldn't email it, so it comes from you.",
}

/**
 * Shown after an invite is created. If Lendly emailed it, says what was sent (sharing by
 * hand is a backup); otherwise sharing the invite becomes the main step.
 */
export function InviteSentDialog({ open, invite, orgName, sharing, onClose }: InviteSentDialogProps) {
  // Nothing to show before the first invite (afterwards `invite` stays set while closing).
  if (!invite) return null

  const copied = sharing.copiedFor === invite.email
  const role = withArticle(invite.role)
  const emailed = invite.delivery === 'invite' || invite.delivery === 'sign-in-link'

  const shareButton = (
    <Button
      variant={emailed ? 'secondary' : 'primary'}
      icon={sharing.canShare ? Share2 : copied ? Check : Copy}
      className={s.sendButton}
      onClick={() => sharing.share(invite.email)}
    >
      {sharing.canShare ? 'Share invite' : copied ? 'Copied' : 'Copy invite message'}
    </Button>
  )

  const steps =
    invite.delivery === 'invite'
      ? {
          title: 'Invite sent',
          description: `We emailed ${invite.email} an invite to join ${orgName} as ${role}.`,
          first: 'They open the email from Lendly and tap Accept invite',
          hint: 'Not there? Ask them to check spam, or send it yourself:',
        }
      : invite.delivery === 'sign-in-link'
        ? {
            title: 'Invite sent',
            description: `${invite.email} already uses Lendly, so we emailed them a sign-in link. They can join ${orgName} as ${role}.`,
            first: 'They sign in with the link from Lendly',
            hint: "That email doesn't mention you, so a quick message helps:",
          }
        : {
            title: 'Invite ready',
            description: `${invite.email} can join ${orgName} as ${role}.`,
            first: 'Send them the invite',
            hint: NOT_EMAILED_HINT[invite.delivery],
          }

  return (
    <Modal open={open} onClose={onClose} title={steps.title} description={steps.description}>
      <div className={s.content}>
        <ol className={s.steps}>
          <li className={s.step}>
            <span className={s.number}>1</span>
            <div className={s.stepBody}>
              <span>{steps.first}</span>
              <span className={s.stepHint}>{steps.hint}</span>
              {shareButton}
            </div>
          </li>
          {!emailed && (
            <li className={s.step}>
              <span className={s.number}>2</span>
              <div className={s.stepBody}>
                <span>
                  They sign in with <span className={s.strong}>{invite.email}</span>
                </span>
              </div>
            </li>
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
    </Modal>
  )
}
