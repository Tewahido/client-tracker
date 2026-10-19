import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { settingsSectionStyles as s } from './SettingsSection.styles'

interface SettingsSectionProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  children: ReactNode
}

export function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <section className={s.root}>
      <div>
        <div className={s.icon}>
          <Icon className={s.iconSvg} />
        </div>
        <h2 className={s.title}>{title}</h2>
        {description && <p className={s.description}>{description}</p>}
      </div>
      <div className={s.body}>{children}</div>
    </section>
  )
}

/** Label/hint on the left, an optional control on the right (stacked on phones). */
export function SettingsRow({ label, hint, children }: { label: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.row}>
      <div>
        <div className={s.rowLabel}>{label}</div>
        {hint && <div className={s.rowHint}>{hint}</div>}
      </div>
      {children}
    </div>
  )
}
