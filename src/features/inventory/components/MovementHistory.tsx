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
  const movements = useInventoryStore((s) => s.getMovementsByProduct(productId))

  if (movements.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        Sin movimientos registrados
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tipo
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Cantidad
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Motivo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {movements.map((m) => (
            <tr key={m.id} className="transition-colors hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {formatDate(m.createdAt)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Badge variant={MOVEMENT_TYPE_VARIANTS[m.type]}>
                  {MOVEMENT_TYPE_LABELS[m.type]}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-gray-900">
                {formatQuantity(m)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {m.reason || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
