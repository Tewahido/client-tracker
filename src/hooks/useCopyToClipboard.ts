import { useCallback } from 'react'
import { toast } from 'sonner'

/** Copy text with a confirmation toast, falling back to showing the text if copying fails. */
export function useCopyToClipboard() {
  return useCallback(async (text: string, successMessage = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
      return true
    } catch {
      toast.error("Couldn't copy automatically", { description: text })
      return false
    }
  }, [])
}
