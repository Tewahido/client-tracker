import { useCallback, useRef } from 'react'

export type LandingSection = 'features' | 'how-it-works' | 'try-it'

/**
 * In-page navigation for the landing page. Scrolls instead of using #anchors, because the
 * app's router owns the URL hash. `goToSignUp` brings the sign-up card into view and puts
 * the cursor in its email field.
 */
export function useLandingNavigation() {
  const signUpRef = useRef<HTMLDivElement>(null)

  const scrollTo = useCallback((section: LandingSection) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const goToSignUp = useCallback(() => {
    const card = signUpRef.current
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Focus without a second jump; the smooth scroll above handles positioning.
    card.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
  }, [])

  return { signUpRef, scrollTo, goToSignUp }
}
