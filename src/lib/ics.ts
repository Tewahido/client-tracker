import { shiftDate } from './dates'
import type { ISODate } from './types'

export interface CalendarEvent {
  uid: string
  date: ISODate
  title: string
  description: string
}

/**
 * RFC 5545 text escaping. Every kind of line break (CRLF, CR, LF) becomes an escaped
 * "\n": a raw CR would let user text start a new line and inject calendar properties.
 */
function escape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n?|\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')
}

const compact = (date: ISODate) => date.replace(/-/g, '')

const utf8 = new TextEncoder()
/** Content lines may hold 75 octets; continuation lines spend one on the leading space. */
const MAX_OCTETS = 75

/** Fold long lines on UTF-8 octet length, only between whole characters (never mid-emoji). */
export function fold(line: string): string {
  const parts: string[] = []
  let current = ''
  let size = 0
  for (const char of line) {
    const bytes = utf8.encode(char).length
    const limit = parts.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1
    if (size + bytes > limit) {
      parts.push(current)
      current = ''
      size = 0
    }
    current += char
    size += bytes
  }
  parts.push(current)
  return parts.map((part, i) => (i === 0 ? part : ` ${part}`)).join('\r\n')
}

/**
 * All-day calendar events with two alarms: 9am the day before and 9am on the day.
 * Calendar apps deliver these even when Lendly is closed, which makes them the
 * most reliable reminder channel without a server.
 */
export function buildCalendar(events: CalendarEvent[], stamp = new Date()): string {
  const dtstamp = stamp.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lendly//Loan reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH']

  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@lendly`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compact(e.date)}`,
      `DTEND;VALUE=DATE:${compact(shiftDate(e.date, 1))}`,
      `SUMMARY:${escape(e.title)}`,
      `DESCRIPTION:${escape(e.description)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escape(e.title)}`,
      'TRIGGER:-PT15H',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escape(e.title)}`,
      'TRIGGER:PT9H',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
