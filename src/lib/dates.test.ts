import { describe, expect, it } from 'vitest'
import { todayIn } from './dates'

describe('todayIn', () => {
  it('gives the calendar date in that time zone, not the server’s', () => {
    // 23:30 UTC on 7 Nov is already 8 Nov in Johannesburg (UTC+2).
    expect(todayIn('Africa/Johannesburg', new Date('2026-11-07T23:30:00Z'))).toBe('2026-11-08')
    expect(todayIn('UTC', new Date('2026-11-07T23:30:00Z'))).toBe('2026-11-07')
  })
})
