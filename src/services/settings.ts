export type ThemePreference = 'system' | 'light' | 'dark'

export interface Settings {
  currency: string
  /** How many days before the due date a loan counts as "due soon" and triggers a reminder. */
  reminderDays: number
  notificationsEnabled: boolean
  /** Used to sign reminder messages sent to borrowers. */
  lenderName: string
  /** Placeholders: {name}, {amount}, {due}, {lender}. */
  reminderTemplate: string
}

export const DEFAULT_REMINDER_TEMPLATE =
  "Hi {name}! Just a friendly reminder that {amount} is due {due}. Let me know if you need anything. Thanks! {lender}"

export const DEFAULT_SETTINGS: Settings = {
  currency: 'ZAR',
  reminderDays: 3,
  notificationsEnabled: false,
  lenderName: '',
  reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
}

const SETTINGS_KEY = 'lendly.settings.v1'
/** Kept separate so the pre-paint script in index.html can read it cheaply. */
export const THEME_KEY = 'lendly.theme'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable (private mode); settings then last for the session only.
  }
}

export function loadTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function saveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // See saveSettings.
  }
}
