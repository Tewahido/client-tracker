import { useOverlay } from '../../app/overlayContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui'
import { useWorkspace } from '../../providers/workspaceContext'
import { OrganizationSection } from '../organizations'
import { DataSection } from './components/DataSection'
import { PreferencesSection } from './components/PreferencesSection'
import { RemindersSection } from './components/RemindersSection'

export function SettingsPage() {
  const { status } = useWorkspace()
  const overlay = useOverlay()

  return (
    <>
      <PageHeader eyebrow="Make it yours" title="Settings" />
      <Card>
        {status === 'ready' && <OrganizationSection onCreateOrg={() => overlay.open({ type: 'org-form' })} />}
        <RemindersSection />
        <PreferencesSection />
        <DataSection />
      </Card>
    </>
  )
}
