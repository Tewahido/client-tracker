import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { emptyStateStyles as s } from './EmptyState.styles'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className={s.root}>
      <div className={s.iconWrap}>
        <Icon className={s.icon} />
      </div>
      <h3 className={s.title}>{title}</h3>
      {description && <p className={s.description}>{description}</p>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  )
}
