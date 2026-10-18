import clsx from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'
import { cardStyles as s } from './Card.styles'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof s.padding
  interactive?: boolean
}

export function Card({ padding = 'md', interactive, className, ...rest }: CardProps) {
  return <div className={clsx(s.base, s.padding[padding], interactive && s.interactive, className)} {...rest} />
}

export function CardHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className={s.header}>
      <h2 className={s.title}>{title}</h2>
      {action}
    </div>
  )
}
