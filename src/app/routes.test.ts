import { describe, expect, it } from 'vitest'
import { parseHash } from './routes'

describe('parseHash', () => {
  it('knows the Organisations page, which has no tab', () => {
    expect(parseHash('#organisations').name).toBe('organisations')
  })

  it('falls back to home for unknown pages', () => {
    expect(parseHash('#nowhere').name).toBe('home')
  })
})
