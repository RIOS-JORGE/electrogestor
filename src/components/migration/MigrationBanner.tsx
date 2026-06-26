import { useState, useEffect } from 'react'
import { clearLegacyStorage } from '../../providers/AuthProvider'

const LEGACY_PREFIX = 'electrogestor-'
const PRESERVED_KEYS = new Set([
  'electrogestor-theme',
])

function hasLegacyData(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(LEGACY_PREFIX) && !PRESERVED_KEYS.has(key)) {
      return true
    }
  }
  return false
}

export function MigrationBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (hasLegacyData()) {
      setVisible(true)
    }
  }, [])

  const handleClear = () => {
    clearLegacyStorage()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-blue-50 border-b border-blue-200 dark:bg-blue-950 dark:border-blue-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Tus datos anteriores fueron migrados a la nube.{' '}
          <span className="font-medium">¿Querés limpiar los datos locales?</span>
        </p>
        <button
          onClick={handleClear}
          className="ml-4 shrink-0 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Limpiar datos locales
        </button>
      </div>
    </div>
  )
}
