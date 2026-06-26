import { useEffect } from 'react'
import { useConnectivityStore } from '../../lib/connectivity'

export function OfflineIndicator() {
  const online = useConnectivityStore((s) => s.online)
  const setOnline = useConnectivityStore((s) => s.setOnline)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  if (online) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950 dark:border-amber-800">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 sm:px-6">
        <svg
          className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Sin conexión — mostrando datos locales
        </p>
      </div>
    </div>
  )
}
