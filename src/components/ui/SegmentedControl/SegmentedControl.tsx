import clsx from 'clsx'
import { motion } from 'motion/react'
import { useId } from 'react'
import { segmentedStyles as s } from './SegmentedControl.styles'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) {
  const layoutId = useId()
  return (
    <div role="tablist" aria-label={label} className={s.root}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            className={clsx(s.option, active && s.active)}
            onClick={() => onChange(option.value)}
          >
            {active && <motion.span layoutId={layoutId} className={s.pill} transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
            <span className={s.label}>{option.label}</span>
            {option.count !== undefined && <span className={clsx(s.count, active && s.countActive)}>{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
