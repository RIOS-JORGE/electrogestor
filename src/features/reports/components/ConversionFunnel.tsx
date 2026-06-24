import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { ConversionData } from '../types'

const COLORS: Record<string, string> = {
  draft: '#9ca3af',
  sent: '#3b82f6',
  accepted: '#22c55e',
  rejected: '#ef4444'
}

const LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada'
}

interface ConversionFunnelProps {
  data: ConversionData[]
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        No hay cotizaciones en este período
      </p>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    name: LABELS[d.status] || d.status
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={formatted}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="count"
          nameKey="name"
        >
          {formatted.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] || '#6b7280'} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [Number(value), 'Cantidad']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}