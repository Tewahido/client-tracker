/** URL-safe base64 (how VAPID public keys are written) to bytes, for PushManager.subscribe. */
export function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

export interface PushMessage {
  title: string
  body: string
  tag: string
  /** In-app hash to open when tapped. */
  url: string
}

const text = (value: unknown, fallback: string) => (typeof value === 'string' && value ? value : fallback)

/**
 * The notification to show for a push from the send-reminders function. Each push must end
 * in a visible notification (iOS stops delivering to apps that show nothing), so anything
 * malformed still shows a generic one, and links only ever point inside the app.
 */
export function readPushMessage(data: unknown): PushMessage {
  const m = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  const url = text(m.url, '#home')
  return {
    title: text(m.title, 'Lendly'),
    body: text(m.body, 'You have a payment reminder.'),
    tag: text(m.tag, 'lendly-push'),
    url: url.startsWith('#') ? url : '#home',
  }
}
