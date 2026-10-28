import { Mail } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { inviteBannerStyles as s } from './InviteBanner.styles'

/** Tells someone already using Lendly that an organisation invited them. Renders nothing otherwise. */
export function InviteBanner({ onView }: { onView: () => void }) {
  const { invites } = useWorkspace()
  if (invites.length === 0) return null

  const message =
    invites.length === 1
      ? `${invites[0].orgName ?? 'An organisation'} invited you to join them on Lendly.`
      : `${invites.length} organisations invited you to join them on Lendly.`

  return (
    <section className={s.root} aria-label="Invitations">
      <Mail className={s.icon} aria-hidden="true" />
      <p className={s.text}>{message}</p>
      <Button size="sm" onClick={onView}>
        {invites.length === 1 ? 'See invite' : 'See invites'}
      </Button>
    </section>
  )
}
