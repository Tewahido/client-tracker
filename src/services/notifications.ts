export type NotifyPermission = NotificationPermission | 'unsupported'

export function notificationPermission(): NotifyPermission {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.requestPermission()
}

interface NotifyOptions {
  body: string
  tag: string
  /** In-app hash to open when the notification is clicked, e.g. "#loans?open=<id>". */
  url: string
}

async function activeRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  // Don't wait forever when no service worker is registered (e.g. in dev).
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1_500))
  return Promise.race([navigator.serviceWorker.ready, timeout])
}

/**
 * Show a system notification. Prefers the service worker (required on Android and
 * for installed apps, and works while the tab is in the background), falling back
 * to the page-level Notification API. Resolves to whether it was actually shown.
 */
export async function showNotification(title: string, { body, tag, url }: NotifyOptions): Promise<boolean> {
  if (notificationPermission() !== 'granted') return false
  const options: NotificationOptions = { body, tag, icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', data: { url } }

  try {
    const registration = await activeRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return true
    }

    // Throws "Illegal constructor" on Android, where only the service worker may notify.
    const notification = new Notification(title, options)
    notification.onclick = () => {
      window.focus()
      window.location.hash = url
      notification.close()
    }
    return true
  } catch {
    return false
  }
}
