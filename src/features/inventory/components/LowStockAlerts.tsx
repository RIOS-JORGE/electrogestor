import { Link } from 'react-router-dom'
import { Card, CardBody } from '../../../shared/components/Card'
import { Badge } from '../../../shared/components/Badge'
import { useInventoryStore } from '../store'
import { getStockStatus } from '../types'

export function LowStockAlerts() {
  const lowStockProducts = useInventoryStore((s) => s.getLowStockProducts())

  if (lowStockProducts.length === 0) {
    return (
      <Card padding="md">
        <CardBody className="flex items-center gap-2 text-sm">
          <svg
            className="h-5 w-5 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-green-700">
            Todo en orden — no hay productos por reponer
          </span>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">
        Productos por reponer ({lowStockProducts.length})
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lowStockProducts.map((product) => {
          const status = getStockStatus(product)
          const shortage = product.minStock - product.stock
          return (
            <Link
              key={product.id}
              to={`/inventario/${product.id}/editar`}
              className="block transition-shadow hover:shadow-md"
            >
              <Card padding="md">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Stock: <span className="font-semibold tabular-nums">{product.stock}</span>
                        {' / '}
                        Mín: <span className="font-semibold tabular-nums">{product.minStock}</span>
                      </p>
                    </div>
                    <Badge
                      variant={status === 'out' ? 'red' : 'yellow'}
                    >
                      {status === 'out' ? 'Sin stock' : 'Bajo'}
                    </Badge>
                  </div>
                  {shortage > 0 && (
                    <p className="mt-2 text-sm font-medium text-orange-600">
                      Faltan {shortage} {product.unit}
                      {shortage !== 1 ? 's' : ''} para alcanzar el mínimo
                    </p>
                  )}
                </CardBody>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
