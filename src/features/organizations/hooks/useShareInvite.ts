import { useCallback, useEffect, useState } from 'react'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'
import { inviteMessage } from '../../../lib/inviteMessage'

/** Phones get the system share sheet (WhatsApp, SMS…); elsewhere the message is copied. */
const canUseShareSheet = () =>
  typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches

/** Shares or copies a ready-made invite message; `copiedFor` briefly names whose message was copied. */
export function useShareInvite(orgName: string) {
  const copy = useCopyToClipboard()
  const [copiedFor, setCopiedFor] = useState<string | null>(null)
  const [canShare] = useState(canUseShareSheet)

  useEffect(() => {
    if (!copiedFor) return
    const timer = window.setTimeout(() => setCopiedFor(null), 2500)
    return () => window.clearTimeout(timer)
  }, [copiedFor])

  const share = useCallback(
    async (email: string) => {
      const text = inviteMessage({ orgName, email, appUrl: window.location.origin })
      if (canShare) {
        try {
          await navigator.share({ title: 'Join me on Lendly', text })
          return
        } catch (err) {
          // Closing the share sheet isn't an error; anything else falls back to copying.
          if (err instanceof DOMException && err.name === 'AbortError') return
        }
      }
      if (await copy(text, 'Invite message copied')) setCopiedFor(email)
    },
    [canShare, copy, orgName],
  )

  return { share, canShare, copiedFor }
}

export type ShareInvite = ReturnType<typeof useShareInvite>
