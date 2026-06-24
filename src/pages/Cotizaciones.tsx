import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../features/quoting/store'
import { Badge } from '../shared/components/Badge'
import { Button } from '../shared/components/Button'
import { Card } from '../shared/components/Card'
import { Modal } from '../shared/components/Modal'
import { SkeletonTable } from '../shared/components/Skeleton'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'
import { useToast } from '../shared/hooks/useToast'
import { Table, type Column } from '../shared/components/Table'
import type { Quote, QuoteStatus } from '../features/quoting/types'

const STATUS_FILTERS: { key: QuoteStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'draft', label: 'Borrador' },
  { key: 'sent', label: 'Enviados' },
  { key: 'accepted', label: 'Aceptados' },
  { key: 'rejected', label: 'Rechazados' },
]

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const STATUS_BADGE_VARIANTS: Record<
  QuoteStatus,
  'gray' | 'blue' | 'green' | 'red'
> = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  rejected: 'red',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR')
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`
}

export function CotizacionesPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Cotizaciones | ElectroGestor'
  }, [])

  const quotes = useQuoteStore((s) => s.quotes)
  const deleteQuote = useQuoteStore((s) => s.deleteQuote)
  const addQuote = useQuoteStore((s) => s.addQuote)
  const { addToast } = useToast()
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    return quotes
      .filter((q) => {
        if (statusFilter !== 'all' && q.status !== statusFilter) return false
        if (search) {
          const qry = search.toLowerCase()
          return q.clientName.toLowerCase().includes(qry)
        }
        return true
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [quotes, statusFilter, search])

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteQuote(deleteTarget.id)
      addToast('Presupuesto eliminado', 'success')
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteQuote, addToast])

  const handleDuplicate = useCallback(
    (quote: Quote) => {
      const newQuote: Quote = {
        ...quote,
        id: crypto.randomUUID(),
        clientName: `${quote.clientName} (Copia)`,
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      addQuote(newQuote)
      addToast('Presupuesto duplicado como borrador', 'success')
    },
    [addQuote, addToast],
  )

  const columns: Column<Quote>[] = useMemo(
    () => [
      {
        key: 'shortId',
        header: 'Número',
        render: (q) => (
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
            #{q.id.slice(0, 8).toUpperCase()}
          </span>
        ),
      },
      {
        key: 'createdAt',
        header: 'Fecha',
        sortable: true,
        render: (q) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(q.createdAt)}
          </span>
        ),
      },
      {
        key: 'clientName',
        header: 'Cliente',
        sortable: true,
        render: (q) => (
          <span className="font-medium text-gray-900 dark:text-white">{q.clientName}</span>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        sortable: true,
        render: (q) => (
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(q.total)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        render: (q) => (
          <Badge variant={STATUS_BADGE_VARIANTS[q.status]}>
            {STATUS_LABELS[q.status]}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (q) => (
          <div className="flex items-center gap-1">
            <Link to={`/cotizaciones/${q.id}`}>
              <Button variant="ghost" size="sm">
                Ver
              </Button>
            </Link>
            <Link to={`/cotizaciones/${q.id}/editar`}>
              <Button variant="ghost" size="sm">
                Editar
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDuplicate(q)
              }}
            >
              Duplicar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(q)
              }}
            >
              Eliminar
            </Button>
          </div>
        ),
      },
    ],
    [handleDuplicate],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Cotizaciones
        </h2>
        <Link to="/cotizaciones/nueva">
          <Button>Nueva cotización</Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap gap-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
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
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : /* Empty state */
      quotes.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-8 w-8 text-green-500"
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
            No hay presupuestos todavía
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Creá tu primer presupuesto para empezar.
          </p>
          <Link to="/cotizaciones/nueva">
            <Button className="mt-4">Nueva cotización</Button>
          </Link>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {statusFilter !== 'all' || search
                  ? 'No se encontraron presupuestos con esos filtros'
                  : 'No hay presupuestos. Creá tu primer presupuesto.'}
              </p>
            </div>
          ) : (
            filtered.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                onClick={() => navigate(`/cotizaciones/${q.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      #{q.id.slice(0, 8).toUpperCase()}
                    </span>
                    <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {q.clientName}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(q.total)}
                      </span>
                      <Badge variant={STATUS_BADGE_VARIANTS[q.status]}>
                        {STATUS_LABELS[q.status]}
                      </Badge>
                    </div>
                    <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(q.createdAt)}
                    </span>
                  </div>
                  <div
                    className="ml-2 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link to={`/cotizaciones/${q.id}/editar`}>
                      <button
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                        aria-label="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(q)
                      }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      aria-label="Duplicar"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(q)
                      }}
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
            ))
          )}
        </div>
      ) : (
        /* Table */
        <Card padding="lg">
          <Table
            columns={columns}
            data={filtered}
            emptyMessage={
              statusFilter !== 'all' || search
                ? 'No se encontraron presupuestos con esos filtros'
                : 'No hay presupuestos. Creá tu primer presupuesto.'
            }
            keyExtractor={(q) => q.id}
            onRowClick={(q) => navigate(`/cotizaciones/${q.id}`)}
          />
        </Card>
      )}

      {/* Delete modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`¿Eliminar presupuesto de ${deleteTarget?.clientName}?`}
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
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
    </div>
  )
}
