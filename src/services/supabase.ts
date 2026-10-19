import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readAuthRedirectError } from '../lib/authRedirect'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Why the sign-in link the user just followed failed, if it did. Read before the client
 * is created (it inspects the same URL), then removed from the address bar so a refresh
 * doesn't show it again.
 */
export const signInLinkError: string | null = url && key ? readAuthRedirectError(window.location) : null
if (signInLinkError) history.replaceState(null, '', window.location.pathname)

/** Null when the app runs without Supabase credentials (local-only mode). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
