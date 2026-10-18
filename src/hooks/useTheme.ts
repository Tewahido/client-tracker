import { useEffect, useSyncExternalStore } from 'react'
import { loadTheme, saveTheme, type ThemePreference } from '../services/settings'

/* Tiny module-level store so every useTheme() caller shares one value without a provider. */
let current: ThemePreference = loadTheme()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setTheme(next: ThemePreference) {
  current = next
  saveTheme(next)
  listeners.forEach((l) => l())
}

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function apply(theme: ThemePreference) {
  const dark = theme === 'dark' || (theme === 'system' && darkQuery().matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0c11' : '#f4f6fb')
}

/** Theme preference shared app-wide, persisted and applied to <html>. Follows the OS while "system". */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    const mq = darkQuery()
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return { theme, setTheme }
}
