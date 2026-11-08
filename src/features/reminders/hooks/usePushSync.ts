import { useEffect } from 'react'
import { useSettings } from '../../../providers/settingsContext'
import { useWorkspace } from '../../../providers/workspaceContext'
import { notificationPermission } from '../../../services/notifications'
import { pushAvailable, turnOnPush } from '../../../services/push'

/**
 * Keeps this device's Web Push subscription saved while reminders are on: after signing in
 * (a device belongs to whoever signed in last), when the browser renewed or dropped its
 * subscription, and when "Start reminding me" changes. Falls back to the in-app check if
 * push can't be set up. Mount once, near the root.
 */
export function usePushSync() {
  const { settings, updateSettings } = useSettings()
  const { status } = useWorkspace()
  const wanted = settings.notificationsEnabled && status === 'ready' && pushAvailable() && notificationPermission() === 'granted'
  const signedOut = status === 'signed-out' || status === 'local'
  const stale = settings.pushOnThisDevice && (signedOut || !settings.notificationsEnabled)

  useEffect(() => {
    if (stale) updateSettings({ pushOnThisDevice: false })
  }, [stale, updateSettings])

  useEffect(() => {
    if (!wanted) return
    let cancelled = false
    turnOnPush(settings.reminderDays).then(
      () => !cancelled && updateSettings({ pushOnThisDevice: true }),
      () => !cancelled && updateSettings({ pushOnThisDevice: false }),
    )
    return () => {
      cancelled = true
    }
  }, [wanted, settings.reminderDays, updateSettings])
}
