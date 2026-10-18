import { createContext, useContext } from 'react'

/** Every dialog the app can open. Kept as data so any screen can open any dialog. */
export type Overlay =
  | { type: 'loan-form'; loanId?: string; borrowerId?: string }
  | { type: 'loan'; loanId: string }
  | { type: 'payment'; loanId: string }
  | { type: 'remind'; loanId: string }
  | { type: 'person-form'; borrowerId?: string }
  | { type: 'person'; borrowerId: string }

export interface OverlayContextValue {
  stack: Overlay[]
  /** Open a dialog on top of whatever is already open. */
  open: (overlay: Overlay) => void
  /** Close the top-most dialog. */
  close: () => void
  /** Replace the top-most dialog (e.g. a form that turns into the detail view after saving). */
  replace: (overlay: Overlay) => void
}

export const OverlayContext = createContext<OverlayContextValue | null>(null)

export function useOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext)
  if (!ctx) throw new Error('useOverlay must be used inside <OverlayProvider>')
  return ctx
}
