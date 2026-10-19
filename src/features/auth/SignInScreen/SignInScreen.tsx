import { ArrowRight, MailCheck, TriangleAlert } from 'lucide-react'
import { CenteredLayout } from '../../../components/layout/CenteredLayout'
import { Button, TextInput } from '../../../components/ui'
import { useSignIn } from '../hooks/useSignIn'
import { signInStyles as s } from './SignInScreen.styles'

export function SignInScreen() {
  const { stage, email, setEmail, code, setCode, busy, error, linkProblem, send, verify, startOver } = useSignIn()

  return (
    <CenteredLayout footer="No password needed. We'll email you a secure sign-in link.">
      {stage === 'email' ? (
        <>
          <h1 className={s.title}>Welcome</h1>
          <p className={s.text}>Sign in or create an account to track loans with your team.</p>
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
              autoFocus
            />
            <Button type="submit" size="lg" fullWidth loading={busy} trailingIcon={ArrowRight}>
              Email me a sign-in link
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className={s.sentIcon}>
            <MailCheck className={s.sentIconSvg} />
          </div>
          <h1 className={s.title}>Check your email</h1>
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
      )}
    </CenteredLayout>
  )
}
