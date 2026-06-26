import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../../shared/components/Toast'
import { useAuth } from '../../providers/AuthProvider'
import { MigrationBanner } from '../migration/MigrationBanner'
import { OfflineIndicator } from '../migration/OfflineIndicator'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, company, signOut } = useAuth()

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <MigrationBanner />
        <OfflineIndicator />
        <header className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
                aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {sidebarOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">ElectroGestor</h1>
              {company && (
                <span className="hidden rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 sm:inline">
                  {company.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                Salir
              </button>
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
