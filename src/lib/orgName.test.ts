import { describe, expect, it } from 'vitest'
import { ACCEPTED_ORG_NAMES, REFUSED_ORG_NAMES } from './orgName.cases'
import { orgNameProblem } from './orgName'

describe('orgNameProblem', () => {
  // The database tests use the same cases, so the form and the database agree.
  it.each(REFUSED_ORG_NAMES)('refuses %j', (name) => {
    expect(orgNameProblem(name)).toBe("Names can't include web addresses or < >")
  })

  it.each(ACCEPTED_ORG_NAMES)('accepts %j', (name) => {
    expect(orgNameProblem(name)).toBeNull()
  })

  it('asks for a name and keeps it short', () => {
    expect(orgNameProblem('   ')).toBe('Give your organisation a name')
    expect(orgNameProblem('x'.repeat(81))).toBe('Keep it under 80 characters')
  })
})
