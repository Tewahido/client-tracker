import { cn } from '../../../lib/cn'
import { progressStyles as s } from './Progress.styles'

interface RingProps {
  value: number
  size?: number
  stroke?: number
  /** Tailwind stroke class, e.g. `stroke-emerald-400`. */
  colorClass: string
  showLabel?: boolean
}

export function ProgressRing({ value, size = 48, stroke = 5, colorClass, showLabel = true }: RingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(1, value))
  return (
    <span className={s.ring.root} style={{ width: size, height: size }} role="img" aria-label={`${Math.round(clamped * 100)}% repaid`}>
      <svg width={size} height={size} className={s.ring.svg}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={s.ring.track} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn(s.ring.value, colorClass)}
        />
      </svg>
      {showLabel && <span className={s.ring.label}>{Math.round(clamped * 100)}%</span>}
    </span>
  )
}

export function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={s.bar.track} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn(s.bar.fill, colorClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}
