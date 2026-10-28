import { Check, Plus } from 'lucide-react'
import { PageHeader } from '../../../../components/layout/PageHeader'
import { Button, Card } from '../../../../components/ui'
import { useWorkspace } from '../../../../providers/workspaceContext'
import { ROLE_LABEL } from '../../roles'
import { InviteList } from '../InviteList'
import { organisationsPageStyles as s } from './OrganisationsPage.styles'

interface OrganisationsPageProps {
  onCreate: () => void
  /** Called after switching to another organisation, e.g. to go to its dashboard. */
  onOpened: () => void
}

/** Every organisation the signed-in user belongs to, which one is open, and invites waiting for them. */
export function OrganisationsPage({ onCreate, onOpened }: OrganisationsPageProps) {
  const { organizations, activeOrg, invites, user, switchOrg } = useWorkspace()

  return (
    <>
      <PageHeader
        eyebrow="Where your loans live"
        title="Organisations"
        subtitle="Open the one you want to work in. Lendly remembers your choice on this device."
        actions={
          <Button variant="secondary" icon={Plus} onClick={onCreate}>
            New organisation
          </Button>
        }
      />

      {invites.length > 0 && (
        <section className={s.section} aria-labelledby="invites-title">
          <h2 id="invites-title" className={s.sectionTitle}>
            Invites for you
          </h2>
          <InviteList />
        </section>
      )}

      <section className={s.section} aria-labelledby="orgs-title">
        <h2 id="orgs-title" className={s.sectionTitle}>
          Your organisations
        </h2>
        <Card padding="none">
          <ul className={s.list} aria-labelledby="orgs-title">
            {organizations.map((org) => {
              const current = org.id === activeOrg?.id
              return (
                <li key={org.id} className={s.item}>
                  <span className={s.badge}>{org.name.slice(0, 1).toUpperCase()}</span>
                  <div className={s.main}>
                    <div className={s.name}>{org.name}</div>
                    <div className={s.meta}>{ROLE_LABEL[org.role]}</div>
                  </div>
                  {current ? (
                    <span className={s.current}>
                      <Check className={s.currentIcon} />
                      Open now
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`Open ${org.name}`}
                      onClick={() => {
                        switchOrg(org.id)
                        onOpened()
                      }}
                    >
                      Open
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      </section>

      <p className={s.footnote}>
        Invites are sent to <span className={s.strong}>{user?.email}</span>, the email you signed in with. If someone invited a different address,
        sign in with that one to see it.
      </p>
    </>
  )
}
