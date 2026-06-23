import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../shared/components/Card'
import { useClientStore } from '../features/clients/store'
import { useInvoiceStore } from '../features/invoicing/store'
import { DashboardWidget } from '../features/scheduling/components/DashboardWidget'
import { InventoryDashboardWidget } from '../features/inventory/components/InventoryDashboardWidget'

export function Dashboard() {
  useEffect(() => {
    document.title = 'Dashboard | ElectroGestor'
  }, [])

  const clientCount = useClientStore((s) => s.clients.length)
  const invoiceCount = useInvoiceStore((s) => s.invoices.length)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            ⚡ Bienvenido a ElectroGestor
          </h2>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600">
            Tu herramienta para cotizar, gestionar clientes y administrar tu
            trabajo eléctrico.
          </p>
        </CardBody>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link to="/clientes" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardBody>
              <p className="text-sm font-medium text-gray-500">
                Total Clientes
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-600">
                {clientCount}
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/cotizaciones" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardBody>
              <p className="text-sm font-medium text-gray-500">
                Últimas Cotizaciones
              </p>
              <p className="mt-1 text-3xl font-bold text-green-600">—</p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/facturacion" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardBody>
              <p className="text-sm font-medium text-gray-500">
                Total Facturas
              </p>
              <p className="mt-1 text-3xl font-bold text-purple-600">
                {invoiceCount}
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardWidget />
        <InventoryDashboardWidget />
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/clientes" className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:shadow-md">
            <CardBody className="text-center">
              <div className="mb-4 mt-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Gestioná tu base de clientes con historial
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/cotizaciones" className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:shadow-md">
            <CardBody className="text-center">
              <div className="mb-4 mt-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cotizaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generá presupuestos profesionales en minutos
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/facturacion" className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:shadow-md">
            <CardBody className="text-center">
              <div className="mb-4 mt-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Facturación</h3>
              <p className="mt-1 text-sm text-gray-500">
                Gestioná tus facturas electrónicas
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  )
}
