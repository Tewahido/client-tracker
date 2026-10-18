import { useCallback, useState, type FormEvent } from 'react'
import { useWorkspace } from '../../../providers/workspaceContext'

/** Name field and submit handler for creating an organisation. */
export function useCreateOrgForm(onCreated?: () => void) {
  const { createOrg } = useWorkspace()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed) return setError('Give your organisation a name')
      if (trimmed.length > 80) return setError('Keep it under 80 characters')
      setBusy(true)
      setError(null)
      try {
        await createOrg(trimmed)
        setName('')
        onCreated?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not create the organisation')
      } finally {
        setBusy(false)
      }
    },
    [name, createOrg, onCreated],
  )

  return { name, setName: (v: string) => (setName(v), setError(null)), busy, error, submit }
}
