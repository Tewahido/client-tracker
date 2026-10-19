import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import type { ISODate } from './types'

export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd')
}

export function today(): ISODate {
  return toISODate(new Date())
}

export function shiftDate(date: ISODate, days: number): ISODate {
  return toISODate(addDays(parseISO(date), days))
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(parseISO(to), parseISO(from))
}

export function formatDate(date: ISODate, pattern = 'd MMM yyyy'): string {
  return format(parseISO(date), pattern)
}

/** Human phrase like "in 3 days", "today", "2 days ago". */
export function relativeDays(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `in ${days} days` : `${-days} days ago`
}
