import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../shared/components/Card'
import { ClientForm } from '../features/clients/components/ClientForm'
import { useClientStore } from '../features/clients/store'

export function ClienteFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = id ? 'Editar cliente | ElectroGestor' : 'Nuevo cliente | ElectroGestor'
  }, [id])

  const client = useClientStore((s) =>
    id ? s.clients.find((c) => c.id === id) : undefined,
  )

  // If editing and client not found, show error
  if (id && !client) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500">Cliente no encontrado</p>
            <button
              onClick={() => navigate('/clientes')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Volver a clientes
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">
            {id ? 'Editar cliente' : 'Nuevo cliente'}
          </h2>
        </CardHeader>
        <ClientForm client={client} />
      </Card>
    </div>
  )
}
