import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useSettings } from '../../../providers/settingsContext'
import { notificationPermission, requestNotificationPermission, showNotification, type NotifyPermission } from '../../../services/notifications'
import { needsHomeScreen, pushAvailable, stopPushEverywhere, turnOffPush, turnOnPush } from '../../../services/push'
import { useWorkspace } from '../../../providers/workspaceContext'

/**
 * Browser permission plus the user's opt-in, with enable/disable/test actions. Where Web Push
 * is available, turning on also subscribes this device so reminders arrive with the app closed.
 */
export function useNotificationPermission() {
  const { settings, updateSettings } = useSettings()
  const { status } = useWorkspace()
  const [permission, setPermission] = useState<NotifyPermission>(notificationPermission)

  // The user can change the permission in browser settings while the app is open.
  useEffect(() => {
    const refresh = () => setPermission(notificationPermission())
    document.addEventListener('visibilitychange', refresh)
    return () => document.removeEventListener('visibilitychange', refresh)
  }, [])

  const enable = useCallback(async () => {
    // First thing in the tap: iPhone only shows the permission prompt in direct response to one.
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      let pushProblem = false
      if (pushAvailable()) {
        try {
          await turnOnPush(settings.reminderDays)
          updateSettings({ notificationsEnabled: true, pushOnThisDevice: true })
          toast.success("Reminders on. You'll get them even when Lendly is closed.")
          return
        } catch (err) {
          // The browser's own wording ("push service error") means nothing to a lender; keep it for debugging.
          console.warn('Lendly: push reminders could not be set up', err)
          pushProblem = true
        }
      }
      updateSettings({ notificationsEnabled: true, pushOnThisDevice: false })
      if (pushProblem)
        toast.warning('Reminders on, but only while Lendly is open', {
          description: "We couldn't set them up for when Lendly is closed on this device. We'll try again next time you open it.",
        })
      else toast.success("Reminders on. You'll get them while Lendly is open.")
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

  /** For a lost phone: removes every device of this account from the reminder list. */
  const stopEverywhere = useCallback(async () => {
    try {
      await stopPushEverywhere()
      updateSettings({ pushOnThisDevice: false })
      toast.success('Reminders stopped on all your devices', { description: 'Turn them on again on each device you still use.' })
    } catch (err) {
      console.warn('Lendly: stopping reminders everywhere failed', err)
      toast.error("Couldn't stop reminders on your other devices", { description: 'Check your connection and try again.' })
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
  return {
    permission,
    active,
    pushOn: active && settings.pushOnThisDevice,
    /** This browser could get reminders with Lendly closed, so "only while open" means setting up failed. */
    pushPossible: pushAvailable(),
    needsHomeScreen: needsHomeScreen(),
    /** Signed in, so this account's reminder devices can be managed. */
    canStopEverywhere: status === 'ready' && pushAvailable(),
    enable,
    disable,
    stopEverywhere,
    sendTest,
  }
}
