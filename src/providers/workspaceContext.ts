import { createContext, useContext } from 'react'
import type { Invite, Organization, OrganizationService } from '../services/organizations'

export type WorkspaceStatus = 'local' | 'loading' | 'signed-out' | 'needs-org' | 'ready' | 'error'

export interface WorkspaceValue {
  status: WorkspaceStatus
  error: string | null
  /** Signed-in user, when using Supabase. */
  user: { id: string; email: string } | null
  organizations: Organization[]
  activeOrg: Organization | null
  /** Invites waiting for the signed-in user. */
  invites: Invite[]
  /** Null in local-only mode. */
  service: OrganizationService | null

  switchOrg: (orgId: string) => void
  createOrg: (name: string) => Promise<void>
  acceptInvite: (inviteId: string) => Promise<void>
  declineInvite: (inviteId: string) => Promise<void>
  /** Re-fetch organisations and invites (after renaming, leaving, etc). */
  refresh: () => Promise<void>
  sendSignInEmail: (email: string) => Promise<void>
  verifyCode: (email: string, code: string) => Promise<void>
  signOut: () => Promise<void>
}

export const WorkspaceContext = createContext<WorkspaceValue | null>(null)

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return ctx
}
