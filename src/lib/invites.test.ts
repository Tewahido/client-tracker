import { describe, expect, it } from 'vitest'
import { inviteCount } from './invites'

describe('inviteCount', () => {
  it('says invite for one and invites otherwise', () => {
    expect(inviteCount(1)).toBe('1 invite')
    expect(inviteCount(2)).toBe('2 invites')
  })
})
