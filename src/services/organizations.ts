import type { SupabaseClient } from '@supabase/supabase-js'

export type OrgRole = 'owner' | 'member' | 'viewer'

export interface Organization {
  id: string
  name: string
  /** The signed-in user's role in this organisation. */
  role: OrgRole
}

export interface Member {
  userId: string
  email: string
  role: OrgRole
  joinedAt: string
}

export interface Invite {
  id: string
  orgId: string
  /** Present when listing the signed-in user's own invites. */
  orgName?: string
  email: string
  role: OrgRole
  createdAt: string
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

interface MembershipRow {
  role: OrgRole
  organizations: { id: string; name: string } | null
}

interface InviteRow {
  id: string
  org_id: string
  email: string
  role: OrgRole
  created_at: string
  organizations?: { name: string } | null
}

const toInvite = (r: InviteRow): Invite => ({
  id: r.id,
  orgId: r.org_id,
  orgName: r.organizations?.name,
  email: r.email,
  role: r.role,
  createdAt: r.created_at,
})

/** Organisation membership and invitations. Access rules live in the database (RLS + RPCs). */
export function createOrganizationService(client: SupabaseClient) {
  return {
    async listMine(userId: string): Promise<Organization[]> {
      const rows = unwrap<MembershipRow[]>(
        // Many-to-one embed: PostgREST returns a single object, which the untyped client can't infer.
        await client.from('organization_members').select('role, organizations(id, name)').eq('user_id', userId).overrideTypes<MembershipRow[], { merge: false }>(),
      )
      return rows
        .filter((r) => r.organizations)
        .map((r) => ({ id: r.organizations!.id, name: r.organizations!.name, role: r.role }))
        .sort((a, b) => a.name.localeCompare(b.name))
    },

    async create(name: string): Promise<string> {
      const org = unwrap<{ id: string }>(await client.rpc('create_organization', { p_name: name }))
      return org.id
    },

    async rename(orgId: string, name: string): Promise<void> {
      unwrap(await client.from('organizations').update({ name: name.trim() }).eq('id', orgId))
    },

    async remove(orgId: string): Promise<void> {
      unwrap(await client.from('organizations').delete().eq('id', orgId))
    },

    async leave(orgId: string): Promise<void> {
      unwrap(await client.rpc('leave_organization', { p_org: orgId }))
    },

    async listMembers(orgId: string): Promise<Member[]> {
      const rows = unwrap<{ user_id: string; email: string; role: OrgRole; joined_at: string }[]>(
        await client.from('organization_members').select('user_id, email, role, joined_at').eq('org_id', orgId).order('joined_at'),
      )
      return rows.map((r) => ({ userId: r.user_id, email: r.email, role: r.role, joinedAt: r.joined_at }))
    },

    async setRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
      unwrap(await client.from('organization_members').update({ role }).eq('org_id', orgId).eq('user_id', userId))
    },

    async removeMember(orgId: string, userId: string): Promise<void> {
      unwrap(await client.from('organization_members').delete().eq('org_id', orgId).eq('user_id', userId))
    },

    async listInvites(orgId: string): Promise<Invite[]> {
      const rows = unwrap<InviteRow[]>(
        await client.from('organization_invites').select('id, org_id, email, role, created_at').eq('org_id', orgId).order('created_at'),
      )
      return rows.map(toInvite)
    },

    async invite(orgId: string, email: string, role: OrgRole = 'member'): Promise<void> {
      const result = await client.from('organization_invites').insert({ org_id: orgId, email: email.trim().toLowerCase(), role })
      if (result.error?.code === '23505') throw new Error('That email has already been invited')
      unwrap(result)
    },

    async revokeInvite(inviteId: string): Promise<void> {
      unwrap(await client.from('organization_invites').delete().eq('id', inviteId))
    },

    /** Invites waiting for the signed-in user (matched on their verified email). */
    async listMyInvites(email: string): Promise<Invite[]> {
      const rows = unwrap<InviteRow[]>(
        await client
          .from('organization_invites')
          .select('id, org_id, email, role, created_at, organizations(name)')
          .eq('email', email.toLowerCase())
          .order('created_at')
          .overrideTypes<InviteRow[], { merge: false }>(),
      )
      return rows.map(toInvite)
    },

    async acceptInvite(inviteId: string): Promise<string> {
      return unwrap<string>(await client.rpc('accept_invite', { p_invite: inviteId }))
    },

    async declineInvite(inviteId: string): Promise<void> {
      unwrap(await client.from('organization_invites').delete().eq('id', inviteId))
    },
  }
}

export type OrganizationService = ReturnType<typeof createOrganizationService>
