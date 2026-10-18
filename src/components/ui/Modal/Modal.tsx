import clsx from 'clsx'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../Button'
import { modalStyles as s } from './Modal.styles'

/*
 * Dialogs can stack. Track the open ones so only the top-most reacts to Escape
 * and page scrolling is restored only once the last one closes.
 */
const openDialogs: symbol[] = []

function register(token: symbol) {
  if (openDialogs.push(token) === 1) document.body.style.overflow = 'hidden'
}

function unregister(token: symbol) {
  openDialogs.splice(openDialogs.indexOf(token), 1)
  if (openDialogs.length === 0) document.body.style.overflow = ''
}

const isTopMost = (token: symbol) => openDialogs[openDialogs.length - 1] === token

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
    const token = Symbol('dialog')
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTopMost(token)) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    register(token)
    // Focus the first form control (or the panel) so keyboard users land inside the dialog.
    requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('input, select, textarea') ?? panelRef.current
      target?.focus()
    })
    return () => {
      document.removeEventListener('keydown', onKey)
      unregister(token)
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
