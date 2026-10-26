import { describe, expect, it } from 'vitest'
import { friendlyDbMessage } from './dbErrors'

describe('friendlyDbMessage', () => {
  it('explains a name saved before links were refused', () => {
    expect(friendlyDbMessage('new row for relation "organizations" violates check constraint "organizations_name_plain"')).toMatch(/Rename it in Settings/)
  })

  it('leaves other messages alone', () => {
    expect(friendlyDbMessage('Only owners can email this invite')).toBe('Only owners can email this invite')
  })
})
