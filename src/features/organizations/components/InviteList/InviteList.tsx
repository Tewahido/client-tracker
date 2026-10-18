import { Building2 } from 'lucide-react'
import { Button } from '../../../../components/ui'
import { useInviteResponses } from '../../hooks/useInviteResponses'
import { inviteListStyles as s } from './InviteList.styles'

const ROLE_PHRASE = { owner: 'an owner', member: 'a member', viewer: 'a viewer' } as const

/** Invites waiting for the signed-in user, with accept/decline. Renders nothing when there are none. */
export function InviteList() {
  const { invites, busyId, accept, decline } = useInviteResponses()
  if (invites.length === 0) return null

  return (
    <ul className={s.list}>
      {invites.map((invite) => (
        <li key={invite.id} className={s.item}>
          <span className={s.icon}>
            <Building2 className={s.iconSvg} />
          </span>
          <div className={s.main}>
            <div className={s.name}>{invite.orgName ?? 'An organisation'}</div>
            <div className={s.meta}>Invited you as {ROLE_PHRASE[invite.role]}</div>
          </div>
          <div className={s.actions}>
            <Button size="sm" variant="ghost" disabled={busyId !== null} onClick={() => decline(invite.id)}>
              Decline
            </Button>
            <Button size="sm" loading={busyId === invite.id} disabled={busyId !== null && busyId !== invite.id} onClick={() => accept(invite.id)}>
              Join
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
