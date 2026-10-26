import { useCallback, useState, type FormEvent } from 'react'
import { orgNameProblem } from '../../../lib/orgName'

/** Editable organisation name with a Save that is enabled only for a real change. */
export function useRenameOrgForm(name: string, onRename: (name: string) => Promise<boolean>) {
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const changed = value.trim() !== name && value.trim().length > 0

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!changed) return
      const problem = orgNameProblem(value)
      if (problem) return setError(problem)
      setBusy(true)
      await onRename(value.trim())
      setBusy(false)
    },
    [changed, onRename, value],
  )

  return { value, setValue: (v: string) => (setValue(v), setError(null)), error, busy, changed, submit }
}
