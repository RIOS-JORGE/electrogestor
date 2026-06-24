import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { RevenueData } from '../types'

interface RevenueChartProps {
  data: RevenueData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        No hay datos de facturas pagadas en este período
      </p>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: d.period,
    total: d.total
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formatted}>
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString('es-AR')}`, 'Total']}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}