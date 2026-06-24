import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../shared/components/Card'
import { Badge } from '../shared/components/Badge'
import { Button } from '../shared/components/Button'
import { Modal } from '../shared/components/Modal'
import { StockAdjuster } from '../features/inventory/components/StockAdjuster'
import { MovementHistory } from '../features/inventory/components/MovementHistory'
import { useInventoryStore } from '../features/inventory/store'
import { getStockStatus, CATEGORY_OPTIONS_LABELED, UNIT_OPTIONS_LABELED } from '../features/inventory/types'
import { useToast } from '../shared/hooks/useToast'

const STATUS_LABELS: Record<string, string> = {
  normal: 'Normal',
  low: 'Bajo',
  out: 'Sin stock',
}

const STATUS_VARIANTS: Record<string, 'green' | 'yellow' | 'red'> = {
  normal: 'green',
  low: 'yellow',
  out: 'red',
}

function formatCurrency(n: number | undefined): string {
  if (n == null) return '—'
  return `$${n.toFixed(2)}`
}

export function InventarioDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const product = useInventoryStore((s) =>
    id ? s.products.find((p) => p.id === id) : undefined,
  )
  const deleteProduct = useInventoryStore((s) => s.deleteProduct)
  const { addToast } = useToast()

  const [showAdjuster, setShowAdjuster] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | ElectroGestor`
    }
  }, [product])

  const handleDelete = useCallback(() => {
    if (!product) return
    deleteProduct(product.id)
    addToast('Producto eliminado', 'success')
    navigate('/inventario')
  }, [product, deleteProduct, addToast, navigate])

  if (!product) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Producto no encontrado</p>
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

  const status = getStockStatus(product)
  const categoryLabel =
    CATEGORY_OPTIONS_LABELED.find((c) => c.value === product.category)?.label ??
    product.category
  const unitLabel =
    UNIT_OPTIONS_LABELED.find((u) => u.value === product.unit)?.label ??
    product.unit

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate('/inventario')}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Volver"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="min-w-0 truncate text-2xl font-semibold text-gray-900 dark:text-white">{product.name}</h2>
          <Badge variant={STATUS_VARIANTS[status]} className="shrink-0">
            {STATUS_LABELS[status]}
          </Badge>
        </div>
      </div>

      {/* Product details */}
      <Card>
        <CardBody className="space-y-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoría</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{categoryLabel}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unidad</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{unitLabel}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock actual</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {product.stock}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Stock mínimo</dt>
              <dd className="mt-1 text-sm tabular-nums text-gray-900 dark:text-gray-200">
                {product.minStock}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Precio unitario</dt>
              <dd className="mt-1 text-sm tabular-nums text-gray-900 dark:text-gray-200">
                {formatCurrency(product.unitPrice)}
              </dd>
            </div>
          </dl>

          {product.notes && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-200">
                {product.notes}
              </dd>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={() => setShowAdjuster(true)}
        >
          Ajustar stock
        </Button>
        <Link to={`/inventario/${product.id}/editar`}>
          <Button variant="outline">Editar producto</Button>
        </Link>
        <Button
          variant="danger"
          onClick={() => setShowDeleteModal(true)}
        >
          Eliminar
        </Button>
      </div>

      {/* Movement history */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de movimientos
          </h3>
        </CardHeader>
        <CardBody>
          <MovementHistory productId={product.id} />
        </CardBody>
      </Card>

      {/* Stock adjuster modal */}
      <StockAdjuster
        productId={product.id}
        isOpen={showAdjuster}
        onClose={() => setShowAdjuster(false)}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={`¿Eliminar ${product.name}?`}
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Se eliminará el producto y todo su historial de movimientos. Esta acción
          no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
