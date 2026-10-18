import { AlarmClock, CalendarClock, CircleCheckBig, CircleDashed, Clock, HandHeart, type LucideIcon } from 'lucide-react'
import type { LoanStatus } from '../../../lib/types'

export interface StatusMeta {
  label: string
  icon: LucideIcon
  /** Pill colours. */
  tone: string
  /** Solid accent used for dots, bars and rings. */
  accent: string
  /** Stroke colour for SVG progress rings. */
  stroke: string
}

export const STATUS_META: Record<LoanStatus, StatusMeta> = {
  overdue: {
    label: 'Overdue',
    icon: AlarmClock,
    tone: 'bg-rose-500/12 text-rose-600 ring-rose-500/25 dark:text-rose-300',
    accent: 'bg-rose-500',
    stroke: 'stroke-rose-500',
  },
  'due-today': {
    label: 'Due today',
    icon: CalendarClock,
    tone: 'bg-orange-500/12 text-orange-600 ring-orange-500/25 dark:text-orange-300',
    accent: 'bg-orange-500',
    stroke: 'stroke-orange-500',
  },
  'due-soon': {
    label: 'Due soon',
    icon: Clock,
    tone: 'bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300',
    accent: 'bg-amber-400',
    stroke: 'stroke-amber-400',
  },
  active: {
    label: 'On track',
    icon: CircleDashed,
    tone: 'bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300',
    accent: 'bg-sky-400',
    stroke: 'stroke-sky-400',
  },
  paid: {
    label: 'Paid',
    icon: CircleCheckBig,
    tone: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300',
    accent: 'bg-emerald-400',
    stroke: 'stroke-emerald-400',
  },
  'written-off': {
    label: 'Forgiven',
    icon: HandHeart,
    tone: 'bg-slate-500/12 text-slate-600 ring-slate-500/25 dark:text-slate-300',
    accent: 'bg-slate-400',
    stroke: 'stroke-slate-400',
  },
}
