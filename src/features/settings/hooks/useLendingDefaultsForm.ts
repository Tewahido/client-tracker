import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useLendingDefaults } from '../../../hooks/useLendingDefaults'

interface Values {
  currency: string
  termDays: string
  interestRate: string
}

type Errors = Partial<Record<keyof Values, string>>

export function validateLendingDefaults(v: Values): Errors {
  const errors: Errors = {}
  const term = Number(v.termDays)
  if (!Number.isInteger(term) || term < 1 || term > 3650) errors.termDays = 'Use a whole number of days between 1 and 3650'
  const rate = Number(v.interestRate || 0)
  if (!Number.isFinite(rate) || rate < 0 || rate > 1000) errors.interestRate = 'Use a percentage between 0 and 1000'
  if (!/^[A-Z]{3}$/.test(v.currency)) errors.currency = 'Pick a currency'
  return errors
}

/** Editable copy of the lending defaults with explicit Save, so organisation-wide changes are deliberate. */
export function useLendingDefaultsForm() {
  const { defaults, scope, canChange, save } = useLendingDefaults()
  const toValues = useCallback(
    () => ({ currency: defaults.currency, termDays: String(defaults.termDays), interestRate: defaults.interestRate ? String(defaults.interestRate) : '' }),
    [defaults],
  )
  const [values, setValues] = useState<Values>(toValues)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)

  // Pick up changes saved elsewhere (another owner, another tab).
  useEffect(() => setValues(toValues()), [toValues])

  const set = (key: keyof Values) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const dirty =
    values.currency !== defaults.currency || Number(values.termDays) !== defaults.termDays || Number(values.interestRate || 0) !== defaults.interestRate

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateLendingDefaults(values)
    setErrors(found)
    if (Object.values(found).some(Boolean)) return
    setSaving(true)
    try {
      await save({ currency: values.currency, termDays: Number(values.termDays), interestRate: Number(values.interestRate || 0) })
      toast.success(scope === 'organisation' ? 'Defaults saved for everyone in the organisation' : 'Defaults saved')
    } catch (err) {
      toast.error('Could not save defaults', { description: err instanceof Error ? err.message : String(err) })
    } finally {
      setSaving(false)
    }
  }

  return { values, errors, set, dirty, saving, submit, scope, canChange }
}
