import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../shared/components/Card'
import { Button } from '../shared/components/Button'
import { ClientList } from '../features/clients/components/ClientList'

export function ClientesPage() {
  useEffect(() => {
    document.title = 'Clientes | ElectroGestor'
  }, [])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Clientes</h2>
        <Link to="/clientes/nuevo">
          <Button>Nuevo cliente</Button>
        </Link>
      </div>

      <Card padding="lg">
        <ClientList />
      </Card>
    </div>
  )
}
