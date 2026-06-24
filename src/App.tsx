import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { ClientesPage } from './pages/Clientes'
import { ClienteFormPage } from './pages/ClienteFormPage'
import { CotizacionesPage } from './pages/Cotizaciones'
import { CotizacionFormPage } from './pages/CotizacionFormPage'
import { CotizacionDetailPage } from './pages/CotizacionDetailPage'
import { FacturacionPage } from './pages/FacturacionPage'
import { FacturacionFormPage } from './pages/FacturacionFormPage'
import { FacturacionDetailPage } from './pages/FacturacionDetailPage'
import { AgendaPage } from './pages/AgendaPage'
import { AgendaFormPage } from './pages/AgendaFormPage'
import { AgendaDetailPage } from './pages/AgendaDetailPage'
import { InventarioPage } from './pages/InventarioPage'
import { InventarioFormPage } from './pages/InventarioFormPage'
import { InventarioDetailPage } from './pages/InventarioDetailPage'
import { AjustesPage } from './pages/Ajustes'
import { AdminPage } from './pages/AdminPage'

const ReportesPage = lazy(() => import('./features/reports/page'))

function ProtectedRoutes() {
  const { user, companyUser, loading } = useAuth()

  // Still loading session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  // Not logged in → login page
  if (!user) return <LoginPage />

  // Logged in but not authorized for any company
  if (!companyUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
        <div className="max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sin acceso
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No tenés acceso a ninguna empresa. Contactá al administrador.
          </p>
        </div>
      </div>
    )
  }

  // Authorized → show app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
        <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
        <Route path="/cotizaciones" element={<CotizacionesPage />} />
        <Route path="/cotizaciones/nueva" element={<CotizacionFormPage />} />
        <Route path="/cotizaciones/:id" element={<CotizacionDetailPage />} />
        <Route path="/cotizaciones/:id/editar" element={<CotizacionFormPage />} />
        <Route path="/facturacion" element={<FacturacionPage />} />
        <Route path="/facturacion/nueva" element={<FacturacionFormPage />} />
        <Route path="/facturacion/:id" element={<FacturacionDetailPage />} />
        <Route path="/facturacion/:id/editar" element={<FacturacionFormPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/agenda/nueva" element={<AgendaFormPage />} />
        <Route path="/agenda/:id" element={<AgendaDetailPage />} />
        <Route path="/agenda/:id/editar" element={<AgendaFormPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/inventario/nuevo" element={<InventarioFormPage />} />
        <Route path="/inventario/:id" element={<InventarioDetailPage />} />
        <Route path="/inventario/:id/editar" element={<InventarioFormPage />} />
        <Route path="/ajustes" element={<AjustesPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/reportes"
          element={
            <Suspense fallback={<div className="flex items-center justify-center py-12">Cargando...</div>}>
              <ReportesPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
