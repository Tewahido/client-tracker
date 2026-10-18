import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { CenteredLayout } from '../../../../components/layout/CenteredLayout'
import { Button, TextInput } from '../../../../components/ui'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { useCreateOrgForm } from '../../hooks/useCreateOrgForm'
import { InviteList } from '../InviteList'
import { onboardingStyles as s } from './OnboardingScreen.styles'

/** Shown to signed-in users who don't belong to an organisation yet. */
export function OnboardingScreen() {
  const { user, invites, signOut } = useWorkspace()
  const form = useCreateOrgForm()

  return (
    <CenteredLayout
      tagline="Let's get you set up."
      footer={
        <>
          Signed in as {user?.email} ·{' '}
          <button className={s.signOut} onClick={signOut}>
            Sign out
          </button>
        </>
      }
    >
      <h1 className={s.title}>{invites.length ? "You've been invited" : 'Create your organisation'}</h1>
      <p className={s.text}>
        {invites.length
          ? 'Join to see the loans your team already tracks, or start your own organisation.'
          : 'An organisation holds your loans and people. Invite your partner or team to share it.'}
      </p>

      {invites.length > 0 && (
        <>
          <div className={s.section}>
            <InviteList />
          </div>
          <div className={s.divider}>or</div>
        </>
      )}

      <form className={clsx(s.form, !invites.length && s.section)} onSubmit={form.submit} noValidate>
        <TextInput
          label="Organisation name"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          placeholder="e.g. Nkosi Family"
          error={form.error}
          autoFocus={!invites.length}
        />
        <Button type="submit" size="lg" fullWidth icon={Plus} loading={form.busy} variant={invites.length ? 'secondary' : 'primary'}>
          Create organisation
        </Button>
      </form>
    </CenteredLayout>
  )
}
