import { describe, expect, it } from 'vitest'
import { validatePerson } from './usePersonForm'

const person = (phone: string) => ({ name: 'Sibani', phone, email: '', notes: '' })

describe('validatePerson', () => {
  it('accepts a phone number pasted from an iPhone, with its invisible direction marks', () => {
    const pasted = `${String.fromCharCode(0x202a)}082 722 4979${String.fromCharCode(0x202c)}`
    expect(validatePerson(person(pasted)).phone).toBeUndefined()
  })

  it('still refuses something that is not a phone number', () => {
    expect(validatePerson(person('call me')).phone).toBe('Use digits, spaces and an optional leading +')
  })

  it('leaves the phone optional', () => {
    expect(validatePerson(person('')).phone).toBeUndefined()
  })
})
