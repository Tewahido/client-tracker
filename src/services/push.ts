import { base64UrlToBytes } from '../lib/push'
import { activeRegistration } from './notifications'
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

/**
 * Whether this device can get reminders with Lendly closed (Web Push): signed-in mode, a
 * configured key, and a browser that supports it (on iPhone, only the Home Screen app).
 */
export function pushAvailable(): boolean {
  return !!supabase && !!VAPID_PUBLIC_KEY && 'serviceWorker' in navigator && 'PushManager' in window
}

/** An iPhone or iPad browser tab: Web Push only works once Lendly is added to the Home Screen. */
export function needsHomeScreen(): boolean {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
  return ios && !(navigator as Navigator & { standalone?: boolean }).standalone
}

async function pushManager(): Promise<PushManager> {
  const registration = await activeRegistration()
  if (!registration) throw new Error("Lendly isn't fully installed yet. Reload the app and try again.")
  return registration.pushManager
}

/**
 * Subscribes this device (asking for permission if needed) and saves it, so the daily
 * reminder job pushes to it. Safe to repeat: it reuses an existing subscription.
 */
export async function turnOnPush(reminderDays: number): Promise<void> {
  if (!supabase) return
  const manager = await pushManager()
  const subscription =
    (await manager.getSubscription()) ?? (await manager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(VAPID_PUBLIC_KEY) }))
  const { endpoint, keys } = subscription.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) throw new Error("This browser didn't give Lendly a push address.")
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
    p_reminder_days: reminderDays,
  })
  if (error) throw new Error(error.message)
}

/** Stops pushes to this device: removes it from the database, then unsubscribes. */
export async function turnOffPush(): Promise<void> {
  if (!pushAvailable()) return
  const subscription = await (await pushManager()).getSubscription()
  if (!subscription) return
  // Remove the row first, while still signed in; it's what the daily job reads.
  await supabase?.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
