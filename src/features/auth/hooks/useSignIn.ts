import { useCallback, useState, type FormEvent } from 'react'
import { useWorkspace } from '../../../providers/workspaceContext'

type Stage = 'email' | 'sent'

const message = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.')

/** Passwordless sign-in: request an email, then follow the link or type the code. */
export function useSignIn() {
  const { sendSignInEmail, verifyCode } = useWorkspace()
  const [stage, setStage] = useState<Stage>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault()
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setError('Enter a valid email address')
        return
      }
      setBusy(true)
      setError(null)
      try {
        await sendSignInEmail(email)
        setStage('sent')
      } catch (err) {
        setError(message(err))
      } finally {
        setBusy(false)
      }
    },
    [email, sendSignInEmail],
  )

  const verify = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!/^\d{6,10}$/.test(code.trim())) {
        setError('Enter the code from the email')
        return
      }
      setBusy(true)
      setError(null)
      try {
        await verifyCode(email, code)
        // The auth listener takes it from here.
      } catch (err) {
        setError(message(err))
      } finally {
        setBusy(false)
      }
    },
    [email, code, verifyCode],
  )

  const startOver = useCallback(() => {
    setStage('email')
    setCode('')
    setError(null)
  }, [])

  return { stage, email, setEmail, code, setCode, busy, error, send, verify, startOver }
}
