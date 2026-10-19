import { CloudOff, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, EmptyState } from '../../components/ui'

/** Shown when the ledger couldn't be loaded at all (e.g. offline on first open). */
export function LoadError({ message, onRetry }: { message: string | null; onRetry: () => Promise<void> }) {
  const [retrying, setRetrying] = useState(false)

  const retry = async () => {
    setRetrying(true)
    await onRetry()
    setRetrying(false)
  }

  return (
    <Card>
      <EmptyState
        icon={CloudOff}
        title="We couldn't load your loans"
        description={message ? `Check your connection and try again. (${message})` : 'Check your connection and try again.'}
        action={
          <Button icon={RotateCcw} loading={retrying} onClick={retry}>
            Try again
          </Button>
        }
      />
    </Card>
  )
}
