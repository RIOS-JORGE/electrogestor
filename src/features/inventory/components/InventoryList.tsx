import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInventoryStore } from '../store'
import {
  CATEGORY_OPTIONS_LABELED,
  getStockStatus,
  type Product,
  type ProductCategory,
  type StockStatus,
} from '../types'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { SkeletonTable } from '../../../shared/components/Skeleton'
import { Table, type Column } from '../../../shared/components/Table'
import { useToast } from '../../../shared/hooks/useToast'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_BADGE_LABELS: Record<StockStatus, string> = {
  normal: 'Normal',
  low: 'Bajo',
  out: 'Sin stock',
}

const STATUS_BADGE_VARIANTS: Record<StockStatus, 'green' | 'yellow' | 'red'> = {
  normal: 'green',
  low: 'yellow',
  out: 'red',
}

const CATEGORY_FILTERS: { key: ProductCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Todas' },
  ...CATEGORY_OPTIONS_LABELED.map((c) => ({ key: c.value as ProductCategory, label: c.label })),
]

// ── Formatters ────────────────────────────────────────────────────────────────

function formatCurrency(n: number | undefined): string {
  if (n == null) return '—'
  return `$${n.toFixed(2)}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InventoryList() {
  const navigate = useNavigate()
  const products = useInventoryStore((s) => s.products)
  const deleteProduct = useInventoryStore((s) => s.deleteProduct)
  const { addToast } = useToast()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (search) {
        const qry = search.toLowerCase()
        return p.name.toLowerCase().includes(qry)
      }
      return true
    })
  }, [products, categoryFilter, search])

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      addToast('Producto eliminado', 'success')
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteProduct, addToast])

  const columns: Column<Product>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Producto',
        sortable: true,
        render: (p) => (
          <span className="font-medium text-gray-900">{p.name}</span>
        ),
      },
      {
        key: 'category',
        header: 'Categoría',
        sortable: true,
        render: (p) => (
          <span className="text-sm text-gray-600">
            {CATEGORY_OPTIONS_LABELED.find((c) => c.value === p.category)?.label ?? p.category}
          </span>
        ),
      },
      {
        key: 'stock',
        header: 'Stock',
        sortable: true,
        render: (p) => {
          const status = getStockStatus(p)
          return (
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{p.stock}</span>
              <span className="text-xs text-gray-400">{p.unit}</span>
              <Badge variant={STATUS_BADGE_VARIANTS[status]}>
                {STATUS_BADGE_LABELS[status]}
              </Badge>
            </div>
          )
        },
      },
      {
        key: 'minStock',
        header: 'Stock mín.',
        render: (p) => (
          <span className="tabular-nums text-gray-600">{p.minStock}</span>
        ),
      },
      {
        key: 'unitPrice',
        header: 'Precio',
        sortable: true,
        render: (p) => (
          <span className="tabular-nums text-gray-600">
            {formatCurrency(p.unitPrice)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (p) => (
          <div className="flex items-center gap-1">
            <Link to={`/inventario/${p.id}`}>
              <Button variant="ghost" size="sm">
                Ver
              </Button>
            </Link>
            <Link to={`/inventario/${p.id}/editar`}>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(p)
              }}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <>
      {/* Category filters */}
      <div className="mb-4 flex flex-wrap gap-1">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setCategoryFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === f.key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : /* Empty state */
      products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No hay productos
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Registrá tu primer producto para empezar a controlar el inventario.
          </p>
          <Link to="/inventario/nuevo">
            <Button className="mt-4">Nuevo producto</Button>
          </Link>
        </div>
      ) : (
        /* Table */
        <Table
          columns={columns}
          data={filtered}
          emptyMessage={
            categoryFilter !== 'all' || search
              ? 'No se encontraron productos con esos filtros'
              : 'No hay productos registrados'
          }
          keyExtractor={(p) => p.id}
          onRowClick={(p) => navigate(`/inventario/${p.id}`)}
        />
      )}

      {/* Delete modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`¿Eliminar ${deleteTarget?.name}?`}
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600">
          Se eliminará el producto y todo su historial de movimientos. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  )
}
