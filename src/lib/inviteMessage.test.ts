import { describe, expect, it } from 'vitest'
import { inviteMessage } from './inviteMessage'

describe('inviteMessage', () => {
  const text = inviteMessage({ orgName: 'Test Lenders', email: 'partner@example.com', appUrl: 'https://lendly.example' })

  it('says which organisation they were added to', () => {
    expect(text).toContain('Test Lenders on Lendly')
  })

  it('gives the link and the exact email to sign in with', () => {
    expect(text).toContain('Sign in at https://lendly.example with partner@example.com')
  })
})
