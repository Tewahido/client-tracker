/**
 * Messages we show for sign-in redirect errors. Deliberately fixed text: never display
 * `error_description` from the URL, since anyone can craft a link that puts their own
 * words (e.g. a phishing message) into it.
 */
const MESSAGES: Record<string, string> = {
  otp_expired:
    'That sign-in link has expired or was already used. Links work once and only for about an hour; some email apps also open links to scan them, which uses them up. Request a new link below and open the newest email, or type the code from it instead.',
}
const GENERIC = "That sign-in link didn't work. Please request a new one below."

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
    return MESSAGES[params.get('error_code') ?? ''] ?? GENERIC
  }
  return null
}

/** Holds a value until it is cleared, e.g. a message that should be shown only once. */
export function oneShot<T>(initial: T | null) {
  let value = initial
  return {
    peek: (): T | null => value,
    clear: () => {
      value = null
    },
  }
}
