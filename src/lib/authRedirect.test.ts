import { describe, expect, it } from 'vitest'
import { oneShot, readAuthRedirectError } from './authRedirect'

const at = (hash: string, search = '') => ({ hash, search })

describe('readAuthRedirectError', () => {
  it('explains an expired or already-used sign-in link', () => {
    const message = readAuthRedirectError(
      at('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'),
    )
    expect(message).toMatch(/expired or was already used/)
    expect(message).toMatch(/newest email/)
  })

  it('never shows text from the URL, so a crafted link cannot inject a message', () => {
    const message = readAuthRedirectError(at('#error=x&error_description=Your+account+is+locked.+Call+0800+123+456'))
    expect(message).toBe("That sign-in link didn't work. Please request a new one below.")
    expect(message).not.toMatch(/locked|0800/)
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

describe('oneShot', () => {
  it('keeps the value until cleared, then stays empty', () => {
    const holder = oneShot('expired')
    expect(holder.peek()).toBe('expired')
    expect(holder.peek()).toBe('expired')
    holder.clear()
    expect(holder.peek()).toBeNull()
  })
})
