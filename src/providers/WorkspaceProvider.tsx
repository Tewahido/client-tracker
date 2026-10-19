import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { createOrganizationService, type Invite, type Organization } from '../services/organizations'
import { supabase } from '../services/supabase'
import { WorkspaceContext, type WorkspaceStatus, type WorkspaceValue } from './workspaceContext'

const ACTIVE_ORG_KEY = 'lendly.activeOrg'

function readActiveOrg(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ORG_KEY)
  } catch {
    return null
  }
}

function writeActiveOrg(orgId: string) {
  try {
    localStorage.setItem(ACTIVE_ORG_KEY, orgId)
  } catch {
    // Falls back to the first organisation next time.
  }
}

/** Who is signed in, which organisations they belong to, and which one is active on this device. */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const service = useMemo(() => (supabase ? createOrganizationService(supabase) : null), [])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [activeId, setActiveId] = useState<string | null>(readActiveOrg)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Depend on the id/email strings, not the session object: Supabase issues a new
  // session on every token refresh, which would otherwise re-fetch everything hourly.
  const session = auth.state.mode === 'signed-in' ? auth.state.session : null
  const userId = session?.user.id ?? null
  const userEmail = session?.user.email ?? ''
  const user = useMemo(() => (userId ? { id: userId, email: userEmail } : null), [userId, userEmail])

  const refresh = useCallback(async () => {
    if (!service || !user) return
    try {
      const [orgs, pending] = await Promise.all([service.listMine(user.id), service.listMyInvites(user.email)])
      setOrganizations(orgs)
      setInvites(pending)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoaded(true)
    }
  }, [service, user])

  useEffect(() => {
    setLoaded(false)
    void refresh()
  }, [refresh])

  const switchOrg = useCallback((orgId: string) => {
    writeActiveOrg(orgId)
    setActiveId(orgId)
  }, [])

  const createOrg = useCallback(
    async (name: string) => {
      if (!service) return
      const id = await service.create(name)
      await refresh()
      switchOrg(id)
      toast.success(`${name} is ready`, { description: 'Invite people from Settings so they can see the same loans.' })
    },
    [service, refresh, switchOrg],
  )

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      if (!service) return
      const orgId = await service.acceptInvite(inviteId)
      await refresh()
      switchOrg(orgId)
      toast.success("You're in! Welcome to the team.")
    },
    [service, refresh, switchOrg],
  )

  const declineInvite = useCallback(
    async (inviteId: string) => {
      if (!service) return
      await service.declineInvite(inviteId)
      await refresh()
    },
    [service, refresh],
  )

  const activeOrg = organizations.find((o) => o.id === activeId) ?? organizations[0] ?? null

  let status: WorkspaceStatus
  if (auth.state.mode === 'local') status = 'local'
  else if (auth.state.mode === 'loading') status = 'loading'
  else if (auth.state.mode === 'signed-out') status = 'signed-out'
  else if (!loaded) status = 'loading'
  else if (error && organizations.length === 0) status = 'error'
  else status = activeOrg ? 'ready' : 'needs-org'

  const value = useMemo<WorkspaceValue>(
    () => ({
      status,
      error,
      user,
      organizations,
      activeOrg,
      invites,
      service,
      switchOrg,
      createOrg,
      acceptInvite,
      declineInvite,
      refresh,
      sendSignInEmail: auth.sendSignInEmail,
      verifyCode: auth.verifyCode,
      signOut: auth.signOut,
    }),
    [status, error, user, organizations, activeOrg, invites, service, switchOrg, createOrg, acceptInvite, declineInvite, refresh, auth.sendSignInEmail, auth.verifyCode, auth.signOut],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
