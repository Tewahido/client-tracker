import { useEffect, useRef } from 'react'
import { useMoney } from '../../../hooks/useMoney'
import { dueReminders } from '../../../lib/reminders'
import { useLoanStore } from '../../../providers/loanStoreContext'
import { useSettings } from '../../../providers/settingsContext'
import { notificationLog } from '../../../services/notificationLog'
import { notificationPermission, showNotification } from '../../../services/notifications'
import { deliverReminders } from '../deliverReminders'

const CHECK_EVERY_MS = 30 * 60 * 1000

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

    // The interval and the focus listener can fire together; never run two checks at once.
    let running = false
    const check = async () => {
      if (running || notificationPermission() !== 'granted') return
      const { views, money, soonDays } = latest.current
      const fresh = dueReminders(views, soonDays, money).filter((r) => !notificationLog.has(r.key))
      if (fresh.length === 0) return

      running = true
      try {
        // Log only what was really shown, so a failed notification is retried next check.
        notificationLog.add(await deliverReminders(fresh, (n) => showNotification(n.title, n)))
      } finally {
        running = false
      }
    }

    void check()
    const timer = window.setInterval(() => void check(), CHECK_EVERY_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled])
}
