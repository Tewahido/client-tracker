import { shiftMonths } from './dates'
import type { ISODate, Loan, Payment } from './types'

export const MIN_INSTALMENTS = 2
/** Thirty years of monthly payments; matches the database's check. */
export const MAX_INSTALMENTS = 360

export interface Instalment {
  /** 1-based position in the plan. */
  number: number
  dueOn: ISODate
  amountCents: number
}

/**
 * Where one instalment stands:
 * - `paid` / `paid-late`: covered in full on or before / after its due date
 * - `missed`: its due date has passed and it is not covered
 * - `next`: the first uncovered instalment that isn't late yet (missed ones may come before it)
 * - `upcoming`: later instalments
 * - `forgiven`: uncovered and not yet due when the loan was forgiven
 */
export type InstalmentState = 'paid' | 'paid-late' | 'missed' | 'next' | 'upcoming' | 'forgiven'

export interface InstalmentProgress extends Instalment {
  /** How much of this instalment has been paid, filling instalments oldest first. */
  paidCents: number
  /** Date of the payment that covered it in full. */
  paidOn: ISODate | null
  state: InstalmentState
}

export interface PlanProgress {
  instalments: InstalmentProgress[]
  /** The instalment the next payment goes towards; null once everything is paid. */
  next: InstalmentProgress | null
  /** Instalments past their due date and still unpaid. */
  missedCount: number
  /** Instalments that were paid, but after their due date. */
  paidLateCount: number
  /** What is still owed on missed instalments. */
  arrearsCents: number
}

/** True when the loan is repaid monthly. Tolerates loans saved before plans existed. */
export function hasPlan(loan: Pick<Loan, 'instalmentCount' | 'firstDueOn'>): boolean {
  return !!loan.instalmentCount && !!loan.firstDueOn
}

/** Date of the last instalment, which is the loan's `dueOn`. */
export function lastInstalmentOn(firstDueOn: ISODate, count: number): ISODate {
  return shiftMonths(firstDueOn, count - 1)
}

/** Split a total into `count` whole-cent amounts; the last one takes the leftover cents. */
export function splitTotal(totalCents: number, count: number): { regularCents: number; lastCents: number } {
  const regularCents = Math.floor(totalCents / count)
  return { regularCents, lastCents: totalCents - regularCents * (count - 1) }
}

/** Monthly instalments from the first due date, always counted from it so month ends don't drift. */
export function buildSchedule(firstDueOn: ISODate, count: number, totalCents: number): Instalment[] {
  const { regularCents, lastCents } = splitTotal(totalCents, count)
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    dueOn: shiftMonths(firstDueOn, i),
    amountCents: i === count - 1 ? lastCents : regularCents,
  }))
}

/**
 * Apply payments to the schedule, oldest instalment first, as of `todayDate`.
 * A forgiven loan stops the clock on the day it was forgiven: what was missed by
 * then stays missed, anything later is forgiven.
 */
export function planProgress(schedule: Instalment[], payments: Payment[], todayDate: ISODate, writtenOffOn: ISODate | null = null): PlanProgress {
  const sorted = [...payments].sort((a, b) => a.paidOn.localeCompare(b.paidOn))
  const totalPaid = sorted.reduce((sum, p) => sum + p.amountCents, 0)
  const asOf = writtenOffOn && writtenOffOn < todayDate ? writtenOffOn : todayDate

  let target = 0
  let paymentIndex = 0
  let running = 0
  let next: InstalmentProgress | null = null
  let nextDueSeen = false
  let missedCount = 0
  let paidLateCount = 0
  let arrearsCents = 0

  const instalments = schedule.map((instalment): InstalmentProgress => {
    const before = target
    target += instalment.amountCents
    const paidCents = Math.min(instalment.amountCents, Math.max(0, totalPaid - before))

    // Walk the payments until the running total reaches this instalment's end.
    while (running < target && paymentIndex < sorted.length) running += sorted[paymentIndex++].amountCents
    // A zero-cent instalment (only in data the database would refuse) counts as unpaid rather than crashing.
    const paidOn = running >= target && paymentIndex > 0 ? sorted[paymentIndex - 1].paidOn : null

    let state: InstalmentState
    if (paidOn) {
      state = paidOn <= instalment.dueOn ? 'paid' : 'paid-late'
      if (state === 'paid-late') paidLateCount++
    } else if (instalment.dueOn < asOf) {
      state = 'missed'
      missedCount++
      arrearsCents += instalment.amountCents - paidCents
    } else if (writtenOffOn) {
      state = 'forgiven'
    } else {
      state = nextDueSeen ? 'upcoming' : 'next'
      nextDueSeen = true
    }

    const progress = { ...instalment, paidCents, paidOn, state }
    if (!paidOn && !next) next = progress
    return progress
  })

  return { instalments, next, missedCount, paidLateCount, arrearsCents }
}
