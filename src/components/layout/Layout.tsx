import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../../shared/components/Toast'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-bold text-gray-900">ElectroGestor</h1>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
