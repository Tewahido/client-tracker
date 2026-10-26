import { describe, expect, it } from 'vitest'
import { orgNameProblem } from './orgName'

describe('orgNameProblem', () => {
  // Same cases as the database tests, so the form and the database agree.
  it.each([
    'Urgent: verify at https://evil.example',
    'Visit www.example.org now',
    'Pay at lendly-support.com today',
    'Claim it on secure-bank.co.za',
    '<b>Important</b>',
  ])('refuses %j', (name) => {
    expect(orgNameProblem(name)).toBe("Names can't include web addresses or < >")
  })

  it.each(["St. Mary's Stokvel", 'J.R. & Co.', 'Mom & Dad', 'Dlamini Family Fund 2026'])('accepts %j', (name) => {
    expect(orgNameProblem(name)).toBeNull()
  })

  it('asks for a name and keeps it short', () => {
    expect(orgNameProblem('   ')).toBe('Give your organisation a name')
    expect(orgNameProblem('x'.repeat(81))).toBe('Keep it under 80 characters')
  })
})
