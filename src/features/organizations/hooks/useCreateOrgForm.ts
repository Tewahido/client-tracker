import { useCallback, useState, type FormEvent } from 'react'
import { orgNameProblem } from '../../../lib/orgName'
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
      const problem = orgNameProblem(trimmed)
      if (problem) return setError(problem)
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
