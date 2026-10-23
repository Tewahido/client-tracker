import { useCallback, type KeyboardEvent } from 'react'

const STEPS: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/** Arrow keys for a radio group: select the neighbouring option (wrapping around) and move focus to it. */
export function useRadioKeys<T>(values: T[], value: T, onChange: (value: T) => void) {
  return useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const step = STEPS[e.key]
      if (!step) return
      e.preventDefault()
      const index = (values.indexOf(value) + step + values.length) % values.length
      onChange(values[index])
      e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[index]?.focus()
    },
    [values, value, onChange],
  )
}
