import { useCallback, useState, type FormEvent } from 'react'
import type { InviteDelivery, OrgRole } from '../../../services/organizations'

export type SentInvite = { email: string; role: OrgRole; delivery: InviteDelivery }

/**
 * Email + role fields for inviting someone; `send` resolves to null when the invite failed,
 * or says what happened to its email.
 * After a success `sentOpen` is true and `sent` holds the invite, so the screen can explain
 * the next steps. `sent` outlives `sentOpen` so the dialog keeps its content while it closes.
 */
export function useInviteForm(send: (email: string, role: OrgRole) => Promise<{ delivery: InviteDelivery } | null>) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('member')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<SentInvite | null>(null)
  const [sentOpen, setSentOpen] = useState(false)

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const value = email.trim().toLowerCase()
      if (!/^\S+@\S+\.\S+$/.test(value)) return setError('Enter a valid email address')
      setBusy(true)
      setError(null)
      const result = await send(value, role)
      if (result) {
        setSent({ email: value, role, delivery: result.delivery })
        setSentOpen(true)
        setEmail('')
        setRole('member')
      }
      setBusy(false)
    },
    [email, role, send],
  )

  const dismissSent = useCallback(() => setSentOpen(false), [])

  return { email, setEmail: (v: string) => (setEmail(v), setError(null)), role, setRole, error, busy, submit, sent, sentOpen, dismissSent }
}
