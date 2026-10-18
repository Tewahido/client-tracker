import { shiftDate } from './dates'
import type { ISODate } from './types'

export interface CalendarEvent {
  uid: string
  date: ISODate
  title: string
  description: string
}

/** RFC 5545 text escaping. */
function escape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

const compact = (date: ISODate) => date.replace(/-/g, '')

/** Fold lines longer than 75 octets as the spec requires. */
function fold(line: string): string {
  const parts: string[] = []
  for (let i = 0; i < line.length; i += 73) parts.push((i ? ' ' : '') + line.slice(i, i + 73))
  return parts.join('\r\n')
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
