import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MonthlyTrendData } from '../types'

interface MonthlyTrendsProps {
  data: MonthlyTrendData[]
}

export function MonthlyTrends({ data }: MonthlyTrendsProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        No hay datos de tendencias mensuales
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="invoices"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Facturas"
        />
        <Line
          type="monotone"
          dataKey="quotes"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="Cotizaciones"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}