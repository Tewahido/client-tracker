import { ArrowRight, MailCheck, TriangleAlert } from 'lucide-react'
import { Button, TextInput } from '../../../../components/ui'
import { useSignIn } from '../../hooks/useSignIn'
import { signInPanelStyles as s } from './SignInPanel.styles'

interface SignInPanelProps {
  /** Heading level: h1 on a dedicated screen, h2 when embedded in a page. */
  titleAs?: 'h1' | 'h2'
  title?: string
  intro?: string
  /** Focus the email field on mount (avoid when the panel sits below other content). */
  autoFocus?: boolean
}

/** Passwordless sign-in / sign-up: email step, then "check your email" with a code fallback. */
export function SignInPanel({
  titleAs: Title = 'h2',
  title = 'Welcome',
  intro = 'Sign in or create an account to track loans with your team.',
  autoFocus = false,
}: SignInPanelProps) {
  const { stage, email, setEmail, code, setCode, busy, error, linkProblem, send, verify, startOver } = useSignIn()

  if (stage === 'email') {
    return (
      <>
        <Title className={s.title}>{title}</Title>
        <p className={s.text}>{intro}</p>
        {linkProblem && (
          <div role="alert" className={s.notice}>
            <TriangleAlert className={s.noticeIcon} />
            <p>{linkProblem}</p>
          </div>
        )}
        <form className={s.form} onSubmit={send} noValidate>
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={error}
            autoFocus={autoFocus}
          />
          <Button type="submit" size="lg" fullWidth loading={busy} trailingIcon={ArrowRight}>
            Email me a sign-in link
          </Button>
        </form>
      </>
    )
  }

  return (
    <>
      <div className={s.sentIcon}>
        <MailCheck className={s.sentIconSvg} />
      </div>
      <Title className={s.title}>Check your email</Title>
      <p className={s.text}>
        We sent a sign-in link to <span className={s.strong}>{email}</span>. Open it on this device, or enter the code from the email.
      </p>
      <form className={s.form} onSubmit={verify} noValidate>
        <TextInput
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          error={error}
        />
        <Button type="submit" size="lg" fullWidth loading={busy}>
          Sign in
        </Button>
      </form>
      <div className={s.links}>
        <button className={s.link} onClick={startOver}>
          Use a different email
        </button>
        <button className={s.link} onClick={() => send()} disabled={busy}>
          Resend email
        </button>
      </div>
    </>
  )
}
