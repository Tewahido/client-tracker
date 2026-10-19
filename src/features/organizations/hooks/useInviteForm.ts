import { useCallback, useState, type FormEvent } from 'react'
import type { OrgRole } from '../../../services/organizations'

/** Email + role fields for inviting someone; `send` resolves true when the invite went out. */
export function useInviteForm(send: (email: string, role: OrgRole) => Promise<boolean>) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('member')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const value = email.trim().toLowerCase()
      if (!/^\S+@\S+\.\S+$/.test(value)) return setError('Enter a valid email address')
      setBusy(true)
      setError(null)
      if (await send(value, role)) {
        setEmail('')
        setRole('member')
      }
      setBusy(false)
    },
    [email, role, send],
  )

  return { email, setEmail: (v: string) => (setEmail(v), setError(null)), role, setRole, error, busy, submit }
}
