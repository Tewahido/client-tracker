import { Search, X } from 'lucide-react'
import { searchInputStyles as s } from './SearchInput.styles'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className={s.root}>
      <Search className={s.icon} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={s.input}
      />
      {value && (
        <button type="button" className={s.clear} onClick={() => onChange('')} aria-label="Clear search">
          <X className={s.clearIcon} />
        </button>
      )}
    </div>
  )
}
