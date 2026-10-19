const LOG_KEY = 'lendly.notified.v1'
const KEEP_FOR_MS = 120 * 24 * 60 * 60 * 1000

type Log = Record<string, number>

function read(): Log {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? '{}') as Log
  } catch {
    return {}
  }
}

/** Which reminders this device has already shown, so each one fires only once. */
export const notificationLog = {
  has(key: string): boolean {
    return key in read()
  },

  add(keys: string[]): void {
    const now = Date.now()
    const log = read()
    for (const key of keys) log[key] = now
    // Drop old entries so the log doesn't grow forever.
    for (const [key, at] of Object.entries(log)) if (now - at > KEEP_FOR_MS) delete log[key]
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(log))
    } catch {
      // Without storage we may repeat a reminder; acceptable.
    }
  },
}
