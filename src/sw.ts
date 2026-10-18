/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

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
