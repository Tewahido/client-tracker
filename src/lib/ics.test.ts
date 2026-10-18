import { describe, expect, it } from 'vitest'
import { buildCalendar, fold } from './ics'

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

  it('turns bare carriage returns into escaped newlines so text cannot inject properties', () => {
    const injected = buildCalendar([{ uid: 'x', date: '2026-10-31', title: 'Hi\rATTACH:http://evil', description: 'a\r\nb' }])
    expect(injected).toContain('SUMMARY:Hi\\nATTACH:http://evil')
    expect(injected).toContain('DESCRIPTION:a\\nb')
    expect(injected.split('\r\n').some((line) => line.startsWith('ATTACH'))).toBe(false)
  })
})

describe('fold', () => {
  const octets = (s: string) => new TextEncoder().encode(s).length

  it('keeps every physical line within 75 octets', () => {
    const lines = fold('SUMMARY:' + 'x'.repeat(200)).split('\r\n')
    expect(lines.length).toBeGreaterThan(2)
    for (const line of lines) expect(octets(line)).toBeLessThanOrEqual(75)
  })

  it('never splits a multi-byte character such as an emoji', () => {
    const text = 'SUMMARY:' + '🤝'.repeat(40)
    const lines = fold(text).split('\r\n')
    for (const line of lines) {
      expect(line).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/)
      expect(octets(line)).toBeLessThanOrEqual(75)
    }
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(text)
  })
})
