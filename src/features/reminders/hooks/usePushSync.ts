import { useEffect } from 'react'
import { useSettings } from '../../../providers/settingsContext'
import { useWorkspace } from '../../../providers/workspaceContext'
import { notificationPermission } from '../../../services/notifications'
import { hasPushSubscription, pushAvailable, turnOnPush } from '../../../services/push'

/**
 * Keeps this device's Web Push subscription saved while reminders are on: after signing in
 * (a device belongs to whoever signed in last), when the browser renewed or dropped its
 * subscription, and when "Start reminding me" changes. Falls back to the in-app check only
 * when the browser has no subscription; a failed save (say, offline at launch) keeps push on,
 * since the server still has the device. Mount once, near the root.
 */
export function usePushSync() {
  const { settings, updateSettings } = useSettings()
  const { status } = useWorkspace()
  const wanted = settings.notificationsEnabled && status === 'ready' && pushAvailable() && notificationPermission() === 'granted'
  const stale = settings.pushOnThisDevice && !settings.notificationsEnabled

  useEffect(() => {
    if (stale) updateSettings({ pushOnThisDevice: false })
  }, [stale, updateSettings])

  useEffect(() => {
    if (!wanted) return
    let cancelled = false
    turnOnPush(settings.reminderDays).then(
      () => !cancelled && updateSettings({ pushOnThisDevice: true }),
      async () => {
        const subscribed = await hasPushSubscription().catch(() => false)
        if (!cancelled && !subscribed) updateSettings({ pushOnThisDevice: false })
      },
    )
    return () => {
      cancelled = true
    }
  }, [wanted, settings.reminderDays, updateSettings])
}
