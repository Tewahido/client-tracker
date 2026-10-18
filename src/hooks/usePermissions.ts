import { useMemo } from 'react'
import type { Payment } from '../lib/types'
import { useWorkspace } from '../providers/workspaceContext'
import type { OrgRole } from '../services/organizations'

/**
 * What the current user may do in the active organisation. Mirrors the database
 * rules (supabase/migrations), which remain the real enforcement; this only hides
 * controls that would fail. Local-only mode has a single user with full rights.
 */
export function usePermissions() {
  const { status, activeOrg, user } = useWorkspace()
  const role: OrgRole = status === 'local' ? 'owner' : (activeOrg?.role ?? 'viewer')
  const userId = user?.id

  return useMemo(
    () => ({
      role,
      /** Add and edit people, loans and payments. */
      canEdit: role !== 'viewer',
      /** Delete people and loans, forgive loans, restore backups, manage the organisation. */
      isOwner: role === 'owner',
      canDeletePayment: (payment: Payment) => role === 'owner' || (role === 'member' && !!userId && payment.createdBy === userId),
    }),
    [role, userId],
  )
}
