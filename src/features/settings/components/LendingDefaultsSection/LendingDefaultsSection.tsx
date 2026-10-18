import { Landmark } from 'lucide-react'
import { SettingsSection } from '../../../../components/layout/SettingsSection'
import { Button, SelectInput, TextInput } from '../../../../components/ui'
import { periodLabel } from '../../../../lib/describe'
import { CURRENCIES } from '../../currencies'
import { useLendingDefaultsForm } from '../../hooks/useLendingDefaultsForm'
import { lendingDefaultsStyles as s } from './LendingDefaultsSection.styles'

const TERMS = [7, 14, 30, 60, 90, 180, 365]

export function LendingDefaultsSection() {
  const { values, errors, set, dirty, saving, submit, scope, canChange } = useLendingDefaultsForm()
  // Keep a custom term (e.g. 45 days) selectable even though it isn't a preset.
  const terms = TERMS.includes(Number(values.termDays)) ? TERMS : [...TERMS, Number(values.termDays)].sort((a, b) => a - b)

  return (
    <SettingsSection
      icon={Landmark}
      title="Lending defaults"
      description={
        scope === 'organisation'
          ? 'Shared by everyone in the organisation. New loans start with these values.'
          : 'New loans start with these values.'
      }
    >
      <form className={s.form} onSubmit={submit} noValidate>
        <div className={s.grid}>
          <SelectInput label="Currency" value={values.currency} onChange={(e) => set('currency')(e.target.value)} error={errors.currency} disabled={!canChange}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.label}
              </option>
            ))}
          </SelectInput>
          <SelectInput label="Lending period" value={values.termDays} onChange={(e) => set('termDays')(e.target.value)} error={errors.termDays} disabled={!canChange}>
            {terms.map((d) => (
              <option key={d} value={d}>
                {periodLabel(d)}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Interest %"
            inputMode="decimal"
            value={values.interestRate}
            onChange={(e) => set('interestRate')(e.target.value)}
            error={errors.interestRate}
            placeholder="0"
            disabled={!canChange}
          />
        </div>
        <div className={s.footer}>
          <span className={s.note}>{canChange ? 'You can still change these on any individual loan.' : 'Only organisation owners can change these.'}</span>
          {canChange && (
            <Button type="submit" variant="secondary" size="sm" disabled={!dirty} loading={saving}>
              Save defaults
            </Button>
          )}
        </div>
      </form>
    </SettingsSection>
  )
}
