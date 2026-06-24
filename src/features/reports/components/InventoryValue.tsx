import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { InventoryValueData } from '../types'

interface InventoryValueProps {
  data: InventoryValueData[]
}

export function InventoryValue({ data }: InventoryValueProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        No hay productos en el inventario
      </p>
    )
  }

  const totalValue = data.reduce((sum, d) => sum + d.totalValue, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`$${Number(value).toLocaleString('es-AR')}`, 'Valor']}
          />
          <Bar dataKey="totalValue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Valor total del inventario: <span className="font-semibold">${totalValue.toLocaleString('es-AR')}</span>
      </p>
    </div>
  )
}