import { describe, expect, it } from 'vitest'
import { buildCalendar } from './ics'

describe('buildCalendar', () => {
  const ics = buildCalendar(
    [{ uid: 'loan-1', date: '2026-10-31', title: 'Sipho owes R1,500; due today', description: 'Line one\nLine two' }],
    new Date('2026-10-18T08:00:00Z'),
  )

  it('creates an all-day event with escaped text and two alarms', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261031')
    expect(ics).toContain('DTEND;VALUE=DATE:20261101')
    expect(ics).toContain('SUMMARY:Sipho owes R1\\,500\\; due today')
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two')
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2)
    expect(ics).toContain('DTSTAMP:20261018T080000Z')
  })

  it('uses CRLF line endings', () => {
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })
})
