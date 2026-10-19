/**
 * When a sign-in link fails, Supabase redirects back to the app with the reason in the
 * URL, e.g. `#error=access_denied&error_code=otp_expired&error_description=...`.
 * Returns a message for the user, or null when the URL carries no auth error.
 */
export function readAuthRedirectError(location: { hash: string; search: string }): string | null {
  for (const raw of [location.hash.replace(/^#/, ''), location.search.replace(/^\?/, '')]) {
    // App routes look like "loans?status=overdue"; auth params are the whole fragment.
    const params = new URLSearchParams(raw)
    if (!params.has('error') && !params.has('error_code')) continue

    if (params.get('error_code') === 'otp_expired') {
      return 'That sign-in link has expired or was already used. Links work once and only for about an hour; some email apps also open links to scan them, which uses them up. Request a new link below and open the newest email, or type the code from it instead.'
    }
    const description = params.get('error_description')
    return description ? `Sign-in failed: ${description}` : 'Sign-in failed. Please request a new link.'
  }
  return null
}
