import { describe, expect, it } from 'vitest'
import { readAuthRedirectError } from './authRedirect'

const at = (hash: string, search = '') => ({ hash, search })

describe('readAuthRedirectError', () => {
  it('explains an expired or already-used sign-in link', () => {
    const message = readAuthRedirectError(
      at('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'),
    )
    expect(message).toMatch(/expired or was already used/)
    expect(message).toMatch(/newest email/)
  })

  it('passes through other errors Supabase describes', () => {
    expect(readAuthRedirectError(at('#error=server_error&error_description=Database+error+saving+new+user'))).toBe(
      'Sign-in failed: Database error saving new user',
    )
  })

  it('also reads errors from the query string', () => {
    expect(readAuthRedirectError(at('', '?error=access_denied&error_code=otp_expired'))).toMatch(/expired or was already used/)
  })

  it('ignores successful sign-ins and ordinary app routes', () => {
    expect(readAuthRedirectError(at('#access_token=abc&refresh_token=def&type=magiclink'))).toBeNull()
    expect(readAuthRedirectError(at('#loans?status=overdue'))).toBeNull()
    expect(readAuthRedirectError(at(''))).toBeNull()
  })
})
