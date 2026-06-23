import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../shared/components/Card'
import { ProductForm } from '../features/inventory/components/ProductForm'
import { useInventoryStore } from '../features/inventory/store'

export function InventarioFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = id
      ? 'Editar producto | ElectroGestor'
      : 'Nuevo producto | ElectroGestor'
  }, [id])

  const product = useInventoryStore((s) =>
    id ? s.products.find((p) => p.id === id) : undefined,
  )

  if (id && !product) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500">Producto no encontrado</p>
            <button
              onClick={() => navigate('/inventario')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Volver al inventario
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
            {id ? 'Editar producto' : 'Nuevo producto'}
          </h2>
        </CardHeader>
        <ProductForm editProduct={product} />
      </Card>
    </div>
  )
}
