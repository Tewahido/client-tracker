import { useCallback, useState, type ChangeEvent } from 'react'

type Errors<T> = Partial<Record<keyof T, string>>

/**
 * Small form helper: field values, per-field errors and a submitting flag.
 * `validate` returns an errors object; an empty object means the form is valid.
 */
export function useFormState<T extends Record<string, string>>(initial: T, validate: (values: T) => Errors<T>) {
  const [values, setValues] = useState<T>(initial)
  const [errors, setErrors] = useState<Errors<T>>({})
  const [submitting, setSubmitting] = useState(false)

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  }, [])

  /** Change handler factory for inputs: `onChange={bind('name')}`. */
  const bind = useCallback(
    (key: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValue(key, e.target.value as T[keyof T]),
    [setValue],
  )

  /** Runs validation, then `task` if valid. Resolves true when the task completed. */
  const submit = useCallback(
    async (task: (values: T) => Promise<unknown>) => {
      const found = validate(values)
      setErrors(found)
      if (Object.values(found).some(Boolean)) return false
      setSubmitting(true)
      try {
        await task(values)
        return true
      } catch {
        return false
      } finally {
        setSubmitting(false)
      }
    },
    [validate, values],
  )

  return { values, errors, submitting, setValue, bind, submit }
}
