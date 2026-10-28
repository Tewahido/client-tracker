import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { Button, ConfirmDialog } from '../../../../components/ui'
import type { Invite } from '../../../../services/organizations'
import { useInviteResponses } from '../../hooks/useInviteResponses'
import { inviteListStyles as s } from './InviteList.styles'

const ROLE_PHRASE = { owner: 'an owner', member: 'a member', viewer: 'a viewer' } as const

/**
 * Invites waiting for the signed-in user, with accept/decline. Declining asks first, since
 * someone would have to invite them again. Renders nothing when there are none.
 */
export function InviteList({ onJoined }: { onJoined?: () => void }) {
  const { invites, busyId, accept, decline } = useInviteResponses(onJoined)
  const [declining, setDeclining] = useState<Invite | null>(null)
  if (invites.length === 0) return null

  return (
    <>
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
              <Button variant="ghost" disabled={busyId !== null} onClick={() => setDeclining(invite)}>
                Decline
              </Button>
              <Button loading={busyId === invite.id} disabled={busyId !== null && busyId !== invite.id} onClick={() => accept(invite.id)}>
                Join
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={declining !== null}
        title="Decline this invite?"
        message={`You won't see ${declining?.orgName ?? 'this organisation'}'s loans. Someone there would have to invite you again.`}
        confirmLabel="Decline"
        danger
        onConfirm={() => (declining ? decline(declining.id) : undefined)}
        onClose={() => setDeclining(null)}
      />
    </>
  )
}
