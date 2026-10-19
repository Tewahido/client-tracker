export interface LoadState {
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

export const INITIAL_LOAD_STATE: LoadState = { status: 'loading', error: null }

export const loadSucceeded = (): LoadState => ({ status: 'ready', error: null })

/**
 * What a failed load means for the screen. Before the first successful load there is
 * nothing to show, so it becomes an error (with retry). Afterwards it's a failed
 * background re-sync (e.g. the phone was offline): keep showing the data we have and
 * just tell the user.
 */
export function loadFailed(previous: LoadState, message: string): { state: LoadState; notify: boolean } {
  if (previous.status === 'ready') return { state: previous, notify: true }
  return { state: { status: 'error', error: message }, notify: false }
}
