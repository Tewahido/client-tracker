import clsx from 'clsx'
import { FileUp } from 'lucide-react'
import { useFileDrop } from '../../../hooks/useFileDrop'
import { fileDropZoneStyles as s } from './FileDropZone.styles'

interface FileDropZoneProps {
  /** Accessible name and visible title, e.g. "Restore a backup". */
  label: string
  hint?: string
  /** Value for the file input's `accept` attribute. */
  accept?: string
  disabled?: boolean
  onFile: (file: File) => void
}

/** Drop a file here, or click (or press Enter/Space) to choose one. */
export function FileDropZone({ label, hint, accept, disabled, onFile }: FileDropZoneProps) {
  const { dragging, browse, inputRef, onInputChange, zoneProps } = useFileDrop(onFile, { disabled })

  return (
    <>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={browse}
        className={clsx(s.zone, s.state[disabled ? 'disabled' : dragging ? 'dragging' : 'idle'])}
        {...zoneProps}
      >
        <span className={clsx(s.iconWrap, dragging && s.iconDragging)}>
          <FileUp className={s.icon} />
        </span>
        <span className={s.title}>{dragging ? 'Drop to continue' : label}</span>
        <span className={s.hint}>
          Drag a file here or <span className={s.link}>browse</span>
          {hint ? ` · ${hint}` : ''}
        </span>
      </button>
      <input ref={inputRef} type="file" accept={accept} className={s.input} tabIndex={-1} aria-hidden onChange={onInputChange} />
    </>
  )
}
