import { useCallback, useState, type FormEvent } from 'react'

/** Editable organisation name with a Save that is enabled only for a real change. */
export function useRenameOrgForm(name: string, onRename: (name: string) => Promise<boolean>) {
  const [value, setValue] = useState(name)
  const [busy, setBusy] = useState(false)
  const changed = value.trim() !== name && value.trim().length > 0

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!changed) return
      setBusy(true)
      await onRename(value.trim())
      setBusy(false)
    },
    [changed, onRename, value],
  )

  return { value, setValue, busy, changed, submit }
}
