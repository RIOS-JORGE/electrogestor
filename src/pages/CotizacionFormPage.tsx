import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../shared/components/Card'
import { QuoteWizard } from '../features/quoting/components/QuoteWizard'
import { useQuoteStore } from '../features/quoting/store'

export function CotizacionFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = id ? 'Editar presupuesto | ElectroGestor' : 'Nueva cotización | ElectroGestor'
  }, [id])

  const quote = useQuoteStore((s) =>
    id ? s.quotes.find((q) => q.id === id) : undefined,
  )

  // If editing and quote not found, show error
  if (id && !quote) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500">Presupuesto no encontrado</p>
            <button
              onClick={() => navigate('/cotizaciones')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Volver a cotizaciones
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
          <h2 className="text-xl font-semibold text-gray-900">
            {id ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
        </CardHeader>
        <QuoteWizard editQuote={quote} />
      </Card>
    </div>
  )
}
