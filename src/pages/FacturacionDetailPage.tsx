import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../shared/components/Card'
import { InvoiceDetail } from '../features/invoicing/components/InvoiceDetail'
import { useInvoiceStore } from '../features/invoicing/store'

export function FacturacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const invoice = useInvoiceStore((s) =>
    id ? s.invoices.find((inv) => inv.id === id) : undefined,
  )

  useEffect(() => {
    if (invoice) {
      document.title = `Factura ${invoice.number} | ElectroGestor`
    }
  }, [invoice])

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500">Factura no encontrada</p>
            <button
              onClick={() => navigate('/facturacion')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Volver a facturación
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <InvoiceDetail invoice={invoice} />
    </div>
  )
}
