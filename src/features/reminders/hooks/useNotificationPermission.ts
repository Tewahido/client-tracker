import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSettings } from '../../../providers/settingsContext'
import { notificationPermission, requestNotificationPermission, showNotification, type NotifyPermission } from '../../../services/notifications'

/** Browser permission plus the user's in-app opt-in, with enable/disable/test actions. */
export function useNotificationPermission() {
  const { settings, updateSettings } = useSettings()
  const [permission, setPermission] = useState<NotifyPermission>(notificationPermission)

  // The user can change the permission in browser settings while the app is open.
  useEffect(() => {
    const refresh = () => setPermission(notificationPermission())
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  const enable = useCallback(async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      updateSettings({ notificationsEnabled: true })
      toast.success("Notifications on. We'll nudge you when payments are due.")
    } else if (result === 'denied') {
      toast.error('Notifications are blocked', { description: 'Allow them for this site in your browser settings, then try again.' })
    } else if (result === 'unsupported') {
      toast.error("This browser can't show notifications", { description: 'Use calendar export instead, or install the app.' })
    }
  }, [updateSettings])

  const disable = useCallback(() => updateSettings({ notificationsEnabled: false }), [updateSettings])

  const sendTest = useCallback(
    () => showNotification('Lendly notifications work 🎉', { body: "This is what a payment reminder will look like.", tag: 'lendly-test', url: '#home' }),
    [],
  )

  return { permission, active: settings.notificationsEnabled && permission === 'granted', enable, disable, sendTest }
}
