import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInvoiceStore } from '../store'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { SkeletonTable } from '../../../shared/components/Skeleton'
import { useToast } from '../../../shared/hooks/useToast'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import { Table, type Column } from '../../../shared/components/Table'
import type { Invoice, InvoiceStatus } from '../types'

const STATUS_FILTERS: { key: InvoiceStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'draft', label: 'Borrador' },
  { key: 'issued', label: 'Emitidas' },
  { key: 'paid', label: 'Pagadas' },
  { key: 'cancelled', label: 'Canceladas' },
]

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

const STATUS_BADGE_VARIANTS: Record<InvoiceStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  draft: 'gray',
  issued: 'blue',
  paid: 'green',
  cancelled: 'red',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR')
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`
}

export function InvoiceList() {
  const navigate = useNavigate()

  const invoices = useInvoiceStore((s) => s.invoices)
  const deleteInvoice = useInvoiceStore((s) => s.deleteInvoice)
  const { addToast } = useToast()
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (statusFilter !== 'all' && inv.status !== statusFilter) return false
        if (search) {
          const qry = search.toLowerCase()
          return inv.clientName.toLowerCase().includes(qry)
        }
        return true
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [invoices, statusFilter, search])

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteInvoice(deleteTarget.id)
      addToast('Factura eliminada', 'success')
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteInvoice, addToast])

  const columns: Column<Invoice>[] = useMemo(
    () => [
      {
        key: 'number',
        header: 'Número',
        render: (inv) => (
          <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
            {inv.number}
          </span>
        ),
      },
      {
        key: 'clientName',
        header: 'Cliente',
        sortable: true,
        render: (inv) => (
          <span className="font-medium text-gray-900 dark:text-white">{inv.clientName}</span>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        sortable: true,
        render: (inv) => (
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(inv.total)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        render: (inv) => (
          <Badge variant={STATUS_BADGE_VARIANTS[inv.status]}>
            {STATUS_LABELS[inv.status]}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        header: 'Fecha',
        sortable: true,
        render: (inv) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(inv.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (inv) => (
          <div className="flex items-center gap-1">
            <Link to={`/facturacion/${inv.id}`}>
              <Button variant="ghost" size="sm">
                Ver
              </Button>
            </Link>
            <Link to={`/facturacion/${inv.id}/editar`}>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(inv)
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
      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
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
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : /* Empty state */
      invoices.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No hay facturas todavía
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Creá tu primera factura para empezar.
          </p>
          <Link to="/facturacion/nueva">
            <Button className="mt-4">Nueva factura</Button>
          </Link>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
              onClick={() => navigate(`/facturacion/${inv.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    {inv.number}
                  </span>
                  <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {inv.clientName}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(inv.total)}
                    </span>
                    <Badge variant={STATUS_BADGE_VARIANTS[inv.status]}>
                      {STATUS_LABELS[inv.status]}
                    </Badge>
                  </div>
                  <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(inv.createdAt)}
                  </span>
                </div>
                <div className="ml-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/facturacion/${inv.id}`}>
                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" aria-label="Ver">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </Link>
                  <Link to={`/facturacion/${inv.id}/editar`}>
                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" aria-label="Editar">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(inv)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800 dark:hover:text-red-400"
                    aria-label="Eliminar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          emptyMessage={
            statusFilter !== 'all' || search
              ? 'No se encontraron facturas con esos filtros'
              : 'No hay facturas. Creá tu primera factura.'
          }
          keyExtractor={(inv) => inv.id}
          onRowClick={(inv) => navigate(`/facturacion/${inv.id}`)}
        />
      )}

      {/* Delete modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`¿Eliminar factura ${deleteTarget?.number}?`}
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600">
          Esta acción no se puede deshacer.
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
