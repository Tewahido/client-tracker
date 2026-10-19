import type { ReactNode } from 'react'
import { pageHeaderStyles as s } from './PageHeader.styles'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className={s.root}>
      <div>
        {eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  )
}
