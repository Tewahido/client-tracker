import { Button } from '../../../../components/ui'
import type { LandingSection } from '../../hooks/useLandingNavigation'
import { landingNavStyles as s } from './LandingNav.styles'

const LINKS: { section: LandingSection; label: string }[] = [
  { section: 'features', label: 'Features' },
  { section: 'how-it-works', label: 'How it works' },
  { section: 'try-it', label: 'Try it' },
]

interface LandingNavProps {
  onNavigate: (section: LandingSection) => void
  onSignIn: () => void
}

export function LandingNav({ onNavigate, onSignIn }: LandingNavProps) {
  return (
    <header className={s.root}>
      <nav className={s.inner} aria-label="Main">
        <div className={s.brand}>
          <img src="/favicon.svg" alt="" className={s.mark} />
          <span className={s.name}>Lendly</span>
        </div>
        <div className={s.links}>
          {LINKS.map((link) => (
            <button key={link.section} type="button" className={s.link} onClick={() => onNavigate(link.section)}>
              {link.label}
            </button>
          ))}
        </div>
        <div className={s.actions}>
          <Button variant="secondary" size="sm" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      </nav>
    </header>
  )
}
