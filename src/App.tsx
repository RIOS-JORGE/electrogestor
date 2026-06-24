import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
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

const ReportesPage = lazy(() => import('./features/reports/page'))

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
            <Route path="/cotizaciones" element={<CotizacionesPage />} />
            <Route path="/cotizaciones/nueva" element={<CotizacionFormPage />} />
            <Route path="/cotizaciones/:id" element={<CotizacionDetailPage />} />
            <Route
              path="/cotizaciones/:id/editar"
              element={<CotizacionFormPage />}
            />
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
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
