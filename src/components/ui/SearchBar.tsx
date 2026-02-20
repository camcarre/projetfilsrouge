import { useState, useEffect } from 'preact/hooks'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  value?: string
  className?: string
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Rechercher un ETF...", 
  value = "",
  className = ""
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(searchTerm)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, onSearch])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            isFocused ? 'shadow-lg' : 'shadow-sm'
          }`}
          placeholder={placeholder}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}