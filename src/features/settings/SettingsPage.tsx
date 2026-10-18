import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui'
import { PreferencesSection } from './components/PreferencesSection'
import { RemindersSection } from './components/RemindersSection'

export function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Make it yours" title="Settings" />
      <Card>
        <RemindersSection />
        <PreferencesSection />
      </Card>
    </>
  )
}
