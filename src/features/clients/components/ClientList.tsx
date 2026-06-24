import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useClientStore } from '../store'
import { Table, type Column } from '../../../shared/components/Table'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'
import { SkeletonTable } from '../../../shared/components/Skeleton'
import { useToast } from '../../../shared/hooks/useToast'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import type { Client } from '../types'

export function ClientList() {
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const clients = useClientStore((s) => s.clients)
  const deleteClient = useClientStore((s) => s.deleteClient)
  const { addToast } = useToast()
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search),
      ),
    [clients, search],
  )

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteClient(deleteTarget.id)
      addToast(`Cliente "${deleteTarget.name}" eliminado`, 'success')
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteClient, addToast])

  const columns: Column<Client>[] = useMemo(
    () => [
      { key: 'name', header: 'Nombre', sortable: true },
      { key: 'phone', header: 'Teléfono', sortable: true },
      { key: 'email', header: 'Email', sortable: true },
      {
        key: 'createdAt',
        header: 'Creado',
        sortable: true,
        render: (client) =>
          new Date(client.createdAt).toLocaleDateString('es-AR'),
      },
      {
        key: 'actions',
        header: 'Acciones',
        render: (client) => (
          <div className="flex items-center gap-2">
            <Link to={`/clientes/${client.id}/editar`}>
              <Button variant="ghost" size="sm">
                ✏️
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(client)
              }}
            >
              🗑️
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="max-w-sm">
          <div className="block h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <SkeletonTable rows={5} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="max-w-sm">
        <input
          type="text"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Empty state */}
      {!isLoading && clients.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-16 text-center">
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
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No hay clientes todavía
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Agregá tu primer cliente para empezar a cotizar.
          </p>
          <Link to="/clientes/nuevo">
            <Button className="mt-4">Nuevo cliente</Button>
          </Link>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((client) => (
            <div key={client.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clientes/${client.id}/editar`}
                    className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {client.name}
                  </Link>
                  <div className="mt-1 space-y-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {client.phone && (
                      <span className="block">{client.phone}</span>
                    )}
                    {client.email && (
                      <span className="block truncate">{client.email}</span>
                    )}
                  </div>
                  <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                    Creado {new Date(client.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Link to={`/clientes/${client.id}/editar`}>
                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" aria-label="Editar">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(client)}
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
            search
              ? 'No se encontraron clientes con ese criterio'
              : 'No hay clientes'
          }
          keyExtractor={(c) => c.id}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={`¿Eliminar a ${deleteTarget?.name}?`}
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Esta acción no se puede deshacer. Los presupuestos asociados a este
          cliente se conservarán con el nombre almacenado.
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
