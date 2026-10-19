import { MotionConfig } from 'motion/react'
import { FeatureGrid } from './components/FeatureGrid'
import { FinalCta } from './components/FinalCta'
import { Hero } from './components/Hero'
import { HowItWorks } from './components/HowItWorks'
import { LandingFooter } from './components/LandingFooter'
import { LandingNav } from './components/LandingNav'
import { TryItCalculator } from './components/TryItCalculator'
import { useLandingNavigation } from './hooks/useLandingNavigation'
import { landingPageStyles as s } from './LandingPage.styles'

/** What signed-out visitors see: what Lendly does, with sign-up (passwordless) built into the hero. */
export function LandingPage() {
  const { signUpRef, scrollTo, goToSignUp } = useLandingNavigation()

  return (
    // Honour the OS "reduce motion" setting for every animation on the page.
    <MotionConfig reducedMotion="user">
      <div className={s.root}>
        <LandingNav onNavigate={scrollTo} onSignIn={goToSignUp} />
        <main>
          <Hero signUpRef={signUpRef} />
          <FeatureGrid />
          <HowItWorks />
          <TryItCalculator onStart={goToSignUp} />
          <FinalCta onStart={goToSignUp} />
        </main>
        <LandingFooter />
      </div>
    </MotionConfig>
  )
}
