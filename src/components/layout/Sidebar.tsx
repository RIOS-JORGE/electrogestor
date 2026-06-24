import { useRef, useState, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { exportData, importData } from '../../shared/utils/dataIO'
import { useToast } from '../../shared/hooks/useToast'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/agenda',
    label: 'Agenda',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: '/cotizaciones',
    label: 'Cotizaciones',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/facturacion',
    label: 'Facturación',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    to: '/reportes',
    label: 'Reportes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to: '/ajustes',
    label: 'Ajustes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const { addToast } = useToast()

  const handleExport = useCallback(() => {
    try {
      exportData()
      addToast('Datos exportados correctamente', 'success')
    } catch {
      addToast('Error al exportar los datos', 'error')
    }
  }, [addToast])

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setPendingFile(file)
        setShowImportModal(true)
      }
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [],
  )

  const handleImportConfirm = useCallback(async () => {
    if (!pendingFile) return
    setImporting(true)
    try {
      const result = await importData(pendingFile)
      if (result.success) {
        addToast(
          `Datos importados: ${result.clientsCount} clientes, ${result.quotesCount} presupuestos`,
          'success',
        )
      } else {
        addToast(
          `Error de importación: ${result.errors.join('; ')}`,
          'error',
        )
      }
    } catch {
      addToast('Error inesperado al importar datos', 'error')
    } finally {
      setImporting(false)
      setShowImportModal(false)
      setPendingFile(null)
    }
  }, [pendingFile, addToast])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white
          transition-transform duration-300 ease-in-out
          dark:border-gray-800 dark:bg-gray-900
          lg:static lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-6 dark:border-gray-800">
          <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-lg font-bold text-gray-900 dark:text-white">ElectroGestor</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Export / Import */}
        <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Datos
          </p>
          <div className="space-y-1">
            <button
              onClick={handleExport}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar datos
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar datos
            </button>
          </div>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelected}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        {/* Dark mode toggle */}
        <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
          <button
            onClick={() => {
              const html = document.documentElement
              const isDark = html.classList.toggle('dark')
              localStorage.setItem('electrogestor-theme', isDark ? 'dark' : 'light')
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Modo oscuro
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-500">v0.1.0 — Offline</p>
        </div>

      {/* Import confirmation modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          if (!importing) {
            setShowImportModal(false)
            setPendingFile(null)
          }
        }}
        title="Importar datos"
        size="sm"
      >
        <p className="mb-2 text-sm text-gray-600">
          Esto <strong>reemplazará todos tus datos</strong> actuales (clientes y
          presupuestos) por los del archivo de respaldo.
        </p>
        <p className="mb-6 text-sm text-gray-600">¿Estás seguro?</p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowImportModal(false)
              setPendingFile(null)
            }}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleImportConfirm} disabled={importing}>
            {importing ? 'Importando...' : 'Importar y reemplazar'}
          </Button>
        </div>
      </Modal>
    </aside>

    {/* Close button for mobile */}
    <button
      onClick={onClose}
      className="fixed right-4 top-4 z-50 rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-800"
      aria-label="Cerrar menú"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </>
)
}
