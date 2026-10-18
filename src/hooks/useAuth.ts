import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export type AuthState =
  | { mode: 'local' }
  | { mode: 'loading' }
  | { mode: 'signed-out' }
  | { mode: 'signed-in'; session: Session }

/** Supabase session state. In local-only mode there is nothing to sign in to. */
export function useAuth() {
  const [state, setState] = useState<AuthState>(supabase ? { mode: 'loading' } : { mode: 'local' })

  useEffect(() => {
    if (!supabase) return
    const toState = (session: Session | null): AuthState =>
      session ? { mode: 'signed-in', session } : { mode: 'signed-out' }

    supabase.auth.getSession().then(({ data }) => setState(toState(data.session)))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setState(toState(session)))
    return () => data.subscription.unsubscribe()
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  return { state, sendMagicLink, signOut }
}
