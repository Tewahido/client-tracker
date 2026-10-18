import clsx from 'clsx'
import { avatarStyles as s } from './Avatar.styles'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function paletteFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return s.palettes[hash % s.palettes.length]
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: keyof typeof s.size; className?: string }) {
  return (
    <span aria-hidden className={clsx(s.base, s.size[size], paletteFor(name), className)}>
      {initials(name)}
    </span>
  )
}
