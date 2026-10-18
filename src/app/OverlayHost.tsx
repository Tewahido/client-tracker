import { PersonFormModal } from '../features/people'
import { useOverlay, type Overlay } from './overlayContext'

/** Renders every open dialog, bottom of the stack first so the newest sits on top. */
export function OverlayHost() {
  const { stack } = useOverlay()
  return (
    <>
      {stack.map((overlay, index) => (
        <OverlayView key={`${overlay.type}-${index}`} overlay={overlay} />
      ))}
    </>
  )
}

function OverlayView({ overlay }: { overlay: Overlay }) {
  const { close, replace } = useOverlay()

  switch (overlay.type) {
    case 'person-form':
      return (
        <PersonFormModal
          borrowerId={overlay.borrowerId}
          onClose={close}
          onSaved={(b) => (overlay.borrowerId ? close() : replace({ type: 'person', borrowerId: b.id }))}
        />
      )
    default:
      return null
  }
}
