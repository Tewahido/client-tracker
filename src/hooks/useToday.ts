import { useEffect, useState } from 'react'
import { today } from '../lib/dates'

/** Today's date as `YYYY-MM-DD`, updating when the day rolls over or the tab regains focus. */
export function useToday(): string {
  const [value, setValue] = useState(today)

  useEffect(() => {
    const refresh = () => setValue(today())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return value
}
