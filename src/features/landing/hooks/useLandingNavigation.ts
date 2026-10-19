import { useCallback, useEffect, useRef, useState } from 'react'

export type LandingSection = 'features' | 'how-it-works' | 'try-it'

/**
 * In-page navigation for the landing page. Scrolls instead of using #anchors, because the
 * app's router owns the URL hash. `goToSignUp` brings the sign-up card into view and puts
 * the cursor in its email field.
 */
export function useLandingNavigation() {
  const signUpRef = useRef<HTMLDivElement>(null)
  // Briefly highlights the card so people see where a call to action took them. Each
  // click bumps the counter, which restarts the timer even if the highlight is still on.
  const [highlightRequest, setHighlightRequest] = useState(0)
  const [signUpHighlighted, setSignUpHighlighted] = useState(false)

  useEffect(() => {
    if (highlightRequest === 0) return
    setSignUpHighlighted(true)
    const timer = window.setTimeout(() => setSignUpHighlighted(false), 1600)
    return () => window.clearTimeout(timer)
  }, [highlightRequest])

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
    setHighlightRequest((n) => n + 1)
  }, [])

  return { signUpRef, signUpHighlighted, scrollTo, goToSignUp }
}
