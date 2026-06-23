import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../shared/components/Card'
import { Button } from '../shared/components/Button'
import { InvoiceList } from '../features/invoicing/components/InvoiceList'

export function FacturacionPage() {
  useEffect(() => {
    document.title = 'Facturación | ElectroGestor'
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Facturación
        </h2>
        <Link to="/facturacion/nueva">
          <Button>Nueva factura</Button>
        </Link>
      </div>

      <Card padding="lg">
        <InvoiceList />
      </Card>
    </div>
  )
}
