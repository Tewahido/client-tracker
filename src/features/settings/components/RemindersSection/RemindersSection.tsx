import { BellOff, BellRing, CalendarPlus, Send } from 'lucide-react'
import { Button, SelectInput } from '../../../../components/ui'
import { useCalendarExport, useNotificationPermission } from '../../../reminders'
import { useSettings } from '../../../../providers/settingsContext'
import { SettingsRow, SettingsSection } from '../SettingsSection'
import { remindersSectionStyles as s } from './RemindersSection.styles'

const LEAD_DAYS = [1, 2, 3, 5, 7, 14]

export function RemindersSection() {
  const { settings, updateSettings } = useSettings()
  const { permission, active, enable, disable, sendTest } = useNotificationPermission()
  const { exportAllOpen } = useCalendarExport()

  const notificationHint =
    permission === 'unsupported'
      ? "This browser can't show notifications. Install the app or use calendar export."
      : permission === 'denied'
        ? 'Blocked in your browser settings. Allow notifications for this site to turn them on.'
        : active
          ? 'On for this device. Each person you share with turns it on for their own devices.'
          : 'Get a heads-up on this device before and after due dates.'

  return (
    <SettingsSection icon={BellRing} title="Reminders" description="How and when Lendly nudges you about payments.">
      <SettingsRow label="Notifications" hint={notificationHint}>
        <div className={s.actions}>
          {active && (
            <Button variant="ghost" size="sm" icon={Send} onClick={sendTest}>
              Send test
            </Button>
          )}
          {active ? (
            <Button variant="secondary" size="sm" icon={BellOff} onClick={disable}>
              Turn off
            </Button>
          ) : (
            <Button size="sm" icon={BellRing} onClick={enable} disabled={permission === 'denied' || permission === 'unsupported'}>
              Turn on
            </Button>
          )}
        </div>
      </SettingsRow>

      <SelectInput
        label="Start reminding me"
        value={settings.reminderDays}
        onChange={(e) => updateSettings({ reminderDays: Number(e.target.value) })}
        hint="Loans inside this window show as Due soon. Overdue loans are reminded after 1, 3 and 7 days, then weekly."
        className={s.select}
      >
        {LEAD_DAYS.map((d) => (
          <option key={d} value={d}>
            {d} {d === 1 ? 'day' : 'days'} before the due date
          </option>
        ))}
      </SelectInput>

      <SettingsRow label="Calendar" hint="Add every open loan's due date to your calendar, with alerts. Works even when the app is closed.">
        <Button variant="secondary" size="sm" icon={CalendarPlus} onClick={exportAllOpen}>
          Export due dates
        </Button>
      </SettingsRow>
    </SettingsSection>
  )
}
