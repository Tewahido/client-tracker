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
  switch (overlay.type) {
    default:
      return null
  }
}
