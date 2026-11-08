import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSettings } from '../../../providers/settingsContext'
import { notificationPermission, requestNotificationPermission, showNotification, type NotifyPermission } from '../../../services/notifications'
import { needsHomeScreen, pushAvailable, turnOffPush, turnOnPush } from '../../../services/push'

/**
 * Browser permission plus the user's opt-in, with enable/disable/test actions. Where Web Push
 * is available, turning on also subscribes this device so reminders arrive with the app closed.
 */
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
    let pushProblem: string | null = null
    if (pushAvailable()) {
      try {
        // Subscribing asks for permission itself, inside this tap (iPhone requires that).
        await turnOnPush(settings.reminderDays)
        setPermission(notificationPermission())
        updateSettings({ notificationsEnabled: true, pushOnThisDevice: true })
        toast.success("Reminders on. They'll arrive even when Lendly is closed.")
        return
      } catch (err) {
        pushProblem = err instanceof Error ? err.message : String(err)
      }
    }

    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      updateSettings({ notificationsEnabled: true, pushOnThisDevice: false })
      if (pushProblem) toast.warning('Notifications on while Lendly is open', { description: `Reminders with the app closed couldn't be set up: ${pushProblem}` })
      else toast.success("Notifications on. We'll nudge you when payments are due.")
    } else if (result === 'denied') {
      toast.error('Notifications are blocked', { description: 'Allow them for this site in your browser settings, then try again.' })
    } else if (result === 'unsupported') {
      toast.error("This browser can't show notifications", { description: 'Use calendar export instead, or install the app.' })
    }
  }, [settings.reminderDays, updateSettings])

  const disable = useCallback(async () => {
    updateSettings({ notificationsEnabled: false, pushOnThisDevice: false })
    try {
      await turnOffPush()
    } catch {
      toast.error("Couldn't stop reminders on this device", { description: 'Turn notifications off for Lendly in your phone settings.' })
    }
  }, [updateSettings])

  const sendTest = useCallback(
    async () => {
      const shown = await showNotification('Lendly notifications work 🎉', { body: 'This is what a payment reminder will look like.', tag: 'lendly-test', url: '#home' })
      if (!shown) toast.error("Couldn't show a notification", { description: 'Check that notifications are allowed for this site and for your browser.' })
    },
    [],
  )

  const active = settings.notificationsEnabled && permission === 'granted'
  return { permission, active, pushOn: active && settings.pushOnThisDevice, needsHomeScreen: needsHomeScreen(), enable, disable, sendTest }
}
