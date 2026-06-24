import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { ClientRankingData } from '../types'

interface ClientRankingProps {
  data: ClientRankingData[]
}

export function ClientRanking({ data }: ClientRankingProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        No hay facturas pagadas para rankear clientes
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis
          type="category"
          dataKey="clientName"
          width={120}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString('es-AR')}`, 'Total']}
        />
        <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}