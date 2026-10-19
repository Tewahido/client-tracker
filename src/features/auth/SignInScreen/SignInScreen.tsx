import { CenteredLayout } from '../../../components/layout/CenteredLayout'
import { SignInPanel } from '../components/SignInPanel'

export function SignInScreen() {
  return (
    <CenteredLayout footer="No password needed. We'll email you a secure sign-in link.">
      <SignInPanel titleAs="h1" autoFocus />
    </CenteredLayout>
  )
}
