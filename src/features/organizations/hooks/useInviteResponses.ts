import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useWorkspace } from '../../../providers/workspaceContext'

/** Accept or decline the signed-in user's invites, tracking which one is in flight. */
export function useInviteResponses() {
  const { invites, acceptInvite, declineInvite } = useWorkspace()
  const [busyId, setBusyId] = useState<string | null>(null)

  const respond = useCallback(
    async (inviteId: string, accept: boolean) => {
      setBusyId(inviteId)
      try {
        await (accept ? acceptInvite(inviteId) : declineInvite(inviteId))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setBusyId(null)
      }
    },
    [acceptInvite, declineInvite],
  )

  return { invites, busyId, accept: (id: string) => respond(id, true), decline: (id: string) => respond(id, false) }
}
