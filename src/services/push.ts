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
  // iPads ask for the desktop site, so their Safari says "Macintosh"; only they have touch.
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
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
  // Remove the row first, while still signed in; it's what the daily job reads. Unsubscribe
  // either way: the push service then refuses pushes, and the job drops the row itself.
  const result = await supabase?.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
  if (result?.error) throw new Error(result.error.message)
}

/** Whether this browser still holds a push subscription for Lendly. */
export async function hasPushSubscription(): Promise<boolean> {
  if (!pushAvailable()) return false
  return !!(await (await pushManager()).getSubscription())
}

/**
 * After the session ended without signing out here (expired, revoked, signed out elsewhere):
 * the row can't be deleted without a session, but unsubscribing makes the push service refuse
 * pushes, and the daily job then deletes the row.
 */
export async function unsubscribeThisDevice(): Promise<void> {
  if (!pushAvailable()) return
  await (await (await pushManager()).getSubscription())?.unsubscribe()
}

/** Removes every device of the signed-in account (e.g. a lost phone), then this one's subscription. */
export async function stopPushEverywhere(): Promise<void> {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) throw new Error('Sign in first')
  const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', userId)
  if (error) throw new Error(error.message)
  await unsubscribeThisDevice().catch(() => {})
}
