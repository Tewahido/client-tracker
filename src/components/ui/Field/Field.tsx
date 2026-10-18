import clsx from 'clsx'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { fieldStyles as s } from './Field.styles'

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string | null
  className?: string
  children: (id: string, describedBy: string | undefined) => ReactNode
}

/** Label + hint + error wrapper that wires up ids for accessibility. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={clsx(s.root, className)}>
      <label htmlFor={id} className={s.label}>
        {label}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} className={s.error}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className={s.hint}>
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type Common = { label: string; hint?: ReactNode; error?: string | null; className?: string }

export function TextInput({ label, hint, error, className, prefix, ...rest }: Common & InputHTMLAttributes<HTMLInputElement> & { prefix?: string }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => (
        <div className={s.adornmentWrap}>
          {prefix && <span className={s.adornment}>{prefix}</span>}
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            className={clsx(s.input, prefix && s.withAdornment)}
            {...rest}
          />
        </div>
      )}
    </Field>
  )
}

export function TextArea({ label, hint, error, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => <textarea id={id} aria-describedby={describedBy} aria-invalid={!!error} className={s.textarea} {...rest} />}
    </Field>
  )
}

export function SelectInput({ label, hint, error, className, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id, describedBy) => (
        <select id={id} aria-describedby={describedBy} aria-invalid={!!error} className={s.select} {...rest}>
          {children}
        </select>
      )}
    </Field>
  )
}
