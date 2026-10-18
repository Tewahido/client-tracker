import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui'
import { DataSection } from './components/DataSection'
import { PreferencesSection } from './components/PreferencesSection'
import { RemindersSection } from './components/RemindersSection'

export function SettingsPage() {
  return (
    <>
      <PageHeader eyebrow="Make it yours" title="Settings" />
      <Card>
        <RemindersSection />
        <PreferencesSection />
        <DataSection />
      </Card>
    </>
  )
}
