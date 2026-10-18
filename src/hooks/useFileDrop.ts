import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'

/**
 * Drag-and-drop plus click-to-browse for a single file. Returns handlers for the drop
 * area and the hidden input, and whether a file is currently dragged over the area.
 */
export function useFileDrop(onFile: (file: File) => void, { disabled = false } = {}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  // dragenter/dragleave fire for every child element; count them to know when we really left.
  const depth = useRef(0)

  // While a drop zone is on screen, a file dropped beside it must not make the browser
  // open the file and navigate away from the app.
  useEffect(() => {
    const ignore = (e: globalThis.DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
    }
    window.addEventListener('dragover', ignore)
    window.addEventListener('drop', ignore)
    return () => {
      window.removeEventListener('dragover', ignore)
      window.removeEventListener('drop', ignore)
    }
  }, [])

  const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer.types).includes('Files')

  const onDragEnter = useCallback(
    (e: DragEvent) => {
      if (disabled || !hasFiles(e)) return
      e.preventDefault()
      depth.current += 1
      setDragging(true)
    },
    [disabled],
  )

  const onDragOver = useCallback(
    (e: DragEvent) => {
      if (disabled || !hasFiles(e)) return
      e.preventDefault() // required for the drop event to fire
      e.dataTransfer.dropEffect = 'copy'
    },
    [disabled],
  )

  const onDragLeave = useCallback(() => {
    depth.current = Math.max(0, depth.current - 1)
    if (depth.current === 0) setDragging(false)
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      depth.current = 0
      setDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [disabled, onFile],
  )

  const browse = useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
      e.target.value = '' // allow choosing the same file again
    },
    [onFile],
  )

  return {
    dragging,
    browse,
    inputRef,
    onInputChange,
    zoneProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
  }
}
