import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../shared/components/Card'
import { InvoiceForm } from '../features/invoicing/components/InvoiceForm'
import { useInvoiceStore } from '../features/invoicing/store'

export function FacturacionFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = id
      ? 'Editar factura | ElectroGestor'
      : 'Nueva factura | ElectroGestor'
  }, [id])

  const invoice = useInvoiceStore((s) =>
    id ? s.invoices.find((inv) => inv.id === id) : undefined,
  )

  // If editing and invoice not found, show error
  if (id && !invoice) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Factura no encontrada</p>
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
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {id ? 'Editar factura' : 'Nueva factura'}
          </h2>
        </CardHeader>
        <InvoiceForm editInvoice={invoice} />
      </Card>
    </div>
  )
}
