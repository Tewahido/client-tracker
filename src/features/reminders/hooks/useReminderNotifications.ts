import { useEffect, useRef } from 'react'
import { useMoney } from '../../../hooks/useMoney'
import { dueReminders } from '../../../lib/reminders'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { useSettings } from '../../../providers/settingsContext'
import { notificationLog } from '../../../services/notificationLog'
import { notificationPermission, showNotification } from '../../../services/notifications'

const CHECK_EVERY_MS = 30 * 60 * 1000
/** Above this many new reminders at once, send one summary instead of a burst. */
const MAX_INDIVIDUAL = 3

/**
 * Background scheduler: while the app is open (or installed and running), check for
 * loans entering a new reminder stage and notify this device once per stage.
 * Mount once, near the root.
 */
export function useReminderNotifications() {
  const { views, status } = useLoanStore()
  const { settings } = useSettings()
  const money = useMoney()

  // Keep the latest inputs in a ref so the interval doesn't need re-creating on every change.
  const latest = useRef({ views, money, soonDays: settings.reminderDays })
  useEffect(() => {
    latest.current = { views, money, soonDays: settings.reminderDays }
  })

  const enabled = settings.notificationsEnabled && status === 'ready'

  useEffect(() => {
    if (!enabled) return

    const check = () => {
      if (notificationPermission() !== 'granted') return
      const { views, money, soonDays } = latest.current
      const fresh = dueReminders(views, soonDays, money).filter((r) => !notificationLog.has(r.key))
      if (fresh.length === 0) return

      if (fresh.length > MAX_INDIVIDUAL) {
        void showNotification(`${fresh.length} loans need your attention`, {
          body: fresh.slice(0, 3).map((r) => r.title).join('\n'),
          tag: 'lendly-summary',
          url: '#loans?status=open',
        })
      } else {
        for (const r of fresh) void showNotification(r.title, { body: r.body, tag: r.key, url: `#loans?open=${r.loanId}` })
      }
      notificationLog.add(fresh.map((r) => r.key))
    }

    check()
    const timer = window.setInterval(check, CHECK_EVERY_MS)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])
}
