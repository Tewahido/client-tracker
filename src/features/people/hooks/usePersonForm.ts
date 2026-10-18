import { useCallback, type FormEvent } from 'react'
import { useFormState } from '../../../hooks/useFormState'
import type { Borrower } from '../../../lib/types'
import { useLoanStore } from '../../../providers/loanStoreContext'

export interface PersonFormValues extends Record<string, string> {
  name: string
  phone: string
  email: string
  notes: string
}

export function validatePerson(values: PersonFormValues): Partial<Record<keyof PersonFormValues, string>> {
  const errors: Partial<Record<keyof PersonFormValues, string>> = {}
  if (!values.name.trim()) errors.name = 'Give this person a name'
  if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "That email doesn't look right"
  if (values.phone.trim() && !/^\+?[\d\s()-]{6,}$/.test(values.phone.trim())) errors.phone = 'Use digits, spaces and an optional leading +'
  return errors
}

const emptyToNull = (v: string) => (v.trim() ? v.trim() : null)

/** Create or edit a person. Calls `onSaved` with the stored record. */
export function usePersonForm(borrowerId: string | undefined, onSaved: (borrower: Borrower) => void) {
  const { borrowerById, addBorrower, updateBorrower } = useLoanStore()
  const existing = borrowerId ? borrowerById.get(borrowerId) : undefined

  const form = useFormState<PersonFormValues>(
    {
      name: existing?.name ?? '',
      phone: existing?.phone ?? '',
      email: existing?.email ?? '',
      notes: existing?.notes ?? '',
    },
    validatePerson,
  )

  const { submit } = form
  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      void submit(async (v) => {
        const input = { name: v.name.trim(), phone: emptyToNull(v.phone), email: emptyToNull(v.email), notes: emptyToNull(v.notes) }
        const saved = existing ? await updateBorrower(existing.id, input) : await addBorrower(input)
        onSaved(saved)
      })
    },
    [submit, existing, updateBorrower, addBorrower, onSaved],
  )

  return { ...form, isEdit: !!existing, onSubmit }
}
