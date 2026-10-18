import { SlidersHorizontal } from 'lucide-react'
import { SegmentedControl, SelectInput, TextInput } from '../../../../components/ui'
import { useTheme } from '../../../../hooks/useTheme'
import { useSettings } from '../../../../providers/settingsContext'
import type { ThemePreference } from '../../../../services/settings'
import { CURRENCIES } from '../../currencies'
import { SettingsRow, SettingsSection } from '../../../../components/layout/SettingsSection'
import { preferencesStyles as s } from './PreferencesSection.styles'

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function PreferencesSection() {
  const { settings, updateSettings } = useSettings()
  const { theme, setTheme } = useTheme()

  return (
    <SettingsSection icon={SlidersHorizontal} title="Preferences" description="These apply to this device only.">
      <div className={s.grid}>
        <TextInput
          label="Your first name"
          value={settings.lenderName}
          onChange={(e) => updateSettings({ lenderName: e.target.value })}
          placeholder="Used to greet you"
          autoComplete="given-name"
        />
        <SelectInput label="Currency" value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.label}
            </option>
          ))}
        </SelectInput>
      </div>
      <SettingsRow label="Appearance" hint="Auto follows your device.">
        <SegmentedControl label="Theme" value={theme} onChange={setTheme} options={THEMES} />
      </SettingsRow>
    </SettingsSection>
  )
}
