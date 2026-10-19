import { landingFooterStyles as s } from './LandingFooter.styles'

export function LandingFooter() {
  return (
    <footer className={s.root}>
      <div className={s.inner}>
        <div className={s.brand}>
          <img src="/favicon.svg" alt="" className={s.mark} />
          <span>Lendly</span>
        </div>
        <p className={s.text}>For people who lend to people they care about.</p>
      </div>
    </footer>
  )
}
