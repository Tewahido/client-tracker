import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useWorkspace } from '../../../providers/workspaceContext'

/** Accept or decline the signed-in user's invites, tracking which one is in flight. Calls `onJoined` after accepting. */
export function useInviteResponses(onJoined?: () => void) {
  const { invites, acceptInvite, declineInvite } = useWorkspace()
  const [busyId, setBusyId] = useState<string | null>(null)

  const respond = useCallback(
    async (inviteId: string, accept: boolean) => {
      setBusyId(inviteId)
      try {
        if (accept) {
          await acceptInvite(inviteId)
          onJoined?.()
        } else {
          await declineInvite(inviteId)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setBusyId(null)
      }
    },
    [acceptInvite, declineInvite, onJoined],
  )

  return { invites, busyId, accept: (id: string) => respond(id, true), decline: (id: string) => respond(id, false) }
}
