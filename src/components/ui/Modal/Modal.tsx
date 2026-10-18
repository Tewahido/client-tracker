import clsx from 'clsx'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../Button'
import { modalStyles as s } from './Modal.styles'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  wide?: boolean
  children: ReactNode
}

/** Dialog that slides up as a sheet on phones and pops in centered on larger screens. */
export function Modal({ open, onClose, title, description, wide, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Read the latest onClose without re-running the open/close effect (which would steal focus).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Focus the first form control (or the panel) so keyboard users land inside the dialog.
    requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('input, select, textarea') ?? panelRef.current
      target?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={s.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className={s.positioner} onClick={onClose}>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              className={clsx(s.panel, wide && s.wide)}
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: 'spring', damping: 30, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={s.handle} />
              <div className={s.header}>
                <div className={s.titleWrap}>
                  <h2 className={s.title}>{title}</h2>
                  {description && <p className={s.description}>{description}</p>}
                </div>
                <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Close" onClick={onClose} />
              </div>
              <div className={s.body}>{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
