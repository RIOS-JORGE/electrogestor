import { useMemo } from 'react'
import { Badge } from '../../../shared/components/Badge'
import { useInventoryStore } from '../store'
import type { StockMovement, MovementType } from '../types'

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Salida',
  adjustment: 'Ajuste',
}

const MOVEMENT_TYPE_VARIANTS: Record<MovementType, 'green' | 'red' | 'gray'> = {
  in: 'green',
  out: 'red',
  adjustment: 'gray',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatQuantity(m: StockMovement): string {
  const prefix = m.quantity > 0 ? '+' : ''
  return `${prefix}${m.quantity}`
}

interface MovementHistoryProps {
  productId: string
}

export function MovementHistory({ productId }: MovementHistoryProps) {
  const allMovements = useInventoryStore((s) => s.movements)
  const movements = useMemo(
    () =>
      allMovements
        .filter((m) => m.productId === productId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [allMovements, productId],
  )

  if (movements.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">
        Sin movimientos registrados
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fecha
            </th>
            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Tipo
            </th>
            <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Cantidad
            </th>
            <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Motivo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          {movements.map((m) => (
            <tr key={m.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(m.createdAt)}
              </td>
              <td className="whitespace-nowrap px-2 sm:px-4 py-3">
                <Badge variant={MOVEMENT_TYPE_VARIANTS[m.type]}>
                  {MOVEMENT_TYPE_LABELS[m.type]}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right font-medium tabular-nums text-gray-900 dark:text-white">
                {formatQuantity(m)}
              </td>
              <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {m.reason || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
