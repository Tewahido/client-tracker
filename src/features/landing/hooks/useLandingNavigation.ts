import { useCallback, useEffect, useRef, useState } from 'react'

export type LandingSection = 'features' | 'how-it-works' | 'try-it'

/**
 * In-page navigation for the landing page. Scrolls instead of using #anchors, because the
 * app's router owns the URL hash. `goToSignUp` brings the sign-up card into view and puts
 * the cursor in its email field.
 */
export function useLandingNavigation() {
  const signUpRef = useRef<HTMLDivElement>(null)
  // Briefly highlights the card so people see where a call to action took them.
  const [signUpHighlighted, setSignUpHighlighted] = useState(false)

  useEffect(() => {
    if (!signUpHighlighted) return
    const timer = window.setTimeout(() => setSignUpHighlighted(false), 1600)
    return () => window.clearTimeout(timer)
  }, [signUpHighlighted])

  const scrollTo = useCallback((section: LandingSection) => {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const goToSignUp = useCallback(() => {
    const card = signUpRef.current
    if (!card) return
    // 'start' plus the card's scroll margin keeps it clear of the sticky header.
    card.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Focus without a second jump; the smooth scroll above handles positioning.
    card.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
    setSignUpHighlighted(true)
  }, [])

  return { signUpRef, signUpHighlighted, scrollTo, goToSignUp }
}
