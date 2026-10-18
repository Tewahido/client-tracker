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

  /** Emails a sign-in link (and a one-time code, if the email template includes it). Creates the account if needed. */
  const sendSignInEmail = useCallback(async (email: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }, [])

  /** Signs in with the 6-digit code from the email, handy inside an installed app. */
  const verifyCode = useCallback(async (email: string, code: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  return { state, sendSignInEmail, verifyCode, signOut }
}
