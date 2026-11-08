/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { readPushMessage } from './lib/push'

// __WB_MANIFEST is replaced at build time with the list of files to precache.
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<PrecacheEntry | string> }

// App shell: precache the built assets so the app opens instantly and offline.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// Take over open tabs as soon as a new version installs.
self.skipWaiting()
clientsClaim()

/**
 * Reminders sent by the server (send-reminders) while the app is closed. Every push must
 * show a notification: iOS stops delivering to apps that receive pushes silently.
 */
self.addEventListener('push', (event) => {
  let data: unknown = null
  try {
    data = event.data?.json()
  } catch {
    // Not JSON: readPushMessage shows a generic reminder.
  }
  const { title, body, tag, url } = readPushMessage(data)
  event.waitUntil(self.registration.showNotification(title, { body, tag, icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', data: { url } }))
})

/**
 * Reminder notifications carry an in-app hash (e.g. "#loans?open=<id>").
 * Focus an open Lendly window and navigate it there, or open a new one.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const hash = (event.notification.data as { url?: string } | null)?.url ?? '#home'
  const target = new URL(hash, self.registration.scope).href

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = windows.find((w) => w.url.startsWith(self.registration.scope))
      if (existing) {
        await existing.focus()
        await existing.navigate(target)
        return
      }
      await self.clients.openWindow(target)
    })(),
  )
})
