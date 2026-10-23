import { cn } from '../../../lib/cn'
import { motion } from 'motion/react'
import { useId } from 'react'
import { segmentedStyles as s } from './SegmentedControl.styles'
import { useRadioKeys } from '../../../hooks/useRadioKeys'

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
  /**
   * `tabs` (default) for switching views, like the Loans filters; `radio` for a
   * choice inside a form: a radio group with one tab stop and arrow keys.
   */
  kind?: 'tabs' | 'radio'
}

export function SegmentedControl<T extends string>({ options, value, onChange, label, kind = 'tabs' }: SegmentedControlProps<T>) {
  const layoutId = useId()
  const radio = kind === 'radio'
  const onKeyDown = useRadioKeys(
    options.map((o) => o.value),
    value,
    onChange,
  )

  return (
    <div role={radio ? 'radiogroup' : 'tablist'} aria-label={label} className={s.root} onKeyDown={radio ? onKeyDown : undefined}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            {...(radio ? { role: 'radio', 'aria-checked': active, tabIndex: active ? 0 : -1 } : { role: 'tab', 'aria-selected': active })}
            className={cn(s.option, active && s.active)}
            onClick={() => onChange(option.value)}
          >
            {active && <motion.span layoutId={layoutId} className={s.pill} transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
            <span className={s.label}>{option.label}</span>
            {option.count !== undefined && <span className={cn(s.count, active && s.countActive)}>{option.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
