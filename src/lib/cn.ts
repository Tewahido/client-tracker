import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Join class names (like clsx) and resolve Tailwind conflicts so the later class wins,
 * e.g. cn('text-muted', active && 'text-fg') -> 'text-fg'. Without this, which of two
 * conflicting utilities applies depends on stylesheet order, not on the order you wrote.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
