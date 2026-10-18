import clsx from 'clsx'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { buttonStyles as s } from './Button.styles'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof s.variant
  size?: keyof typeof s.size
  icon?: LucideIcon
  /** Icon placed after the label, e.g. an arrow on "See all" links. */
  trailingIcon?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
  /** Renders a square button; `aria-label` is then required for accessibility. */
  iconOnly?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  trailingIcon: TrailingIcon,
  loading,
  fullWidth,
  iconOnly,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(s.base, s.variant[variant], s.size[size], iconOnly && s.iconOnly[size], fullWidth && s.fullWidth, className)}
      {...rest}
    >
      {loading ? <LoaderCircle className={s.spinner} /> : Icon && <Icon className={s.icon} strokeWidth={2.25} />}
      {children}
      {TrailingIcon && <TrailingIcon className={s.icon} strokeWidth={2.25} />}
    </button>
  )
}
