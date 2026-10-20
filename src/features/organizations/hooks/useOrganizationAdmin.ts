import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useWorkspace } from '../../../providers/workspaceContext'
import type { Invite, InviteDelivery, Member, OrgRole } from '../../../services/organizations'

const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong')

/** Members, invites and admin actions for the active organisation. */
export function useOrganizationAdmin() {
  const { activeOrg, service, user, refresh: refreshWorkspace } = useWorkspace()
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)

  const orgId = activeOrg?.id
  const isOwner = activeOrg?.role === 'owner'

  const reload = useCallback(async () => {
    if (!service || !orgId) return
    try {
      const [m, i] = await Promise.all([service.listMembers(orgId), service.listInvites(orgId)])
      setMembers(m)
      setInvites(i)
    } catch (err) {
      toast.error('Could not load members', { description: errorText(err) })
    } finally {
      setLoading(false)
    }
  }, [service, orgId])

  useEffect(() => {
    void reload()
  }, [reload])

  /** Run an admin action, report errors, and refresh the lists afterwards. */
  const act = useCallback(
    async (task: () => Promise<void>, success?: string) => {
      try {
        await task()
        if (success) toast.success(success)
        await reload()
        return true
      } catch (err) {
        toast.error(errorText(err))
        return false
      }
    },
    [reload],
  )

  return {
    org: activeOrg,
    me: user,
    isOwner,
    members,
    invites,
    loading,
    owners: members.filter((m) => m.role === 'owner').length,

    /** Creates the invite and tries to email it; null when the invite itself failed. */
    invite: async (email: string, role: OrgRole): Promise<{ delivery: InviteDelivery } | null> => {
      let delivery: InviteDelivery = 'failed'
      // No toast: the invite dialog explains the next steps instead.
      const ok = await act(async () => {
        const inviteId = await service!.invite(orgId!, email, role)
        delivery = await service!.emailInvite(inviteId)
      })
      return ok ? { delivery } : null
    },
    revokeInvite: (inviteId: string) => act(() => service!.revokeInvite(inviteId), 'Invite cancelled'),
    setRole: (userId: string, role: OrgRole) => act(() => service!.setRole(orgId!, userId, role), role === 'owner' ? 'Made an owner' : 'Changed to member'),
    removeMember: (userId: string) => act(() => service!.removeMember(orgId!, userId), 'Removed from the organisation'),
    rename: (name: string) =>
      act(async () => {
        await service!.rename(orgId!, name)
        await refreshWorkspace()
      }, 'Organisation renamed'),
    leave: () =>
      act(async () => {
        await service!.leave(orgId!)
        await refreshWorkspace()
      }, `You left ${activeOrg?.name}`),
    deleteOrg: () =>
      act(async () => {
        await service!.remove(orgId!)
        await refreshWorkspace()
      }, `${activeOrg?.name} was deleted`),
  }
}

export type OrganizationAdmin = ReturnType<typeof useOrganizationAdmin>
