import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { AppointmentStatsData } from '../types'

const COLORS = {
  completed: '#22c55e',
  cancelled: '#ef4444',
  scheduled: '#f59e0b'
}

const LABELS = {
  completed: 'Completadas',
  cancelled: 'Canceladas',
  scheduled: 'Programadas'
}

interface AppointmentStatsProps {
  data: AppointmentStatsData
}

export function AppointmentStats({ data }: AppointmentStatsProps) {
  if (data.total === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        No hay turnos en este período
      </p>
    )
  }

  const chartData = [
    { name: LABELS.completed, value: data.completed },
    { name: LABELS.cancelled, value: data.cancelled },
    { name: LABELS.scheduled, value: data.scheduled }
  ].filter((d) => d.value > 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={
                  entry.name === LABELS.completed
                    ? COLORS.completed
                    : entry.name === LABELS.cancelled
                    ? COLORS.cancelled
                    : COLORS.scheduled
                }
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [Number(value), 'Cantidad']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Tasa de completado: <span className="font-semibold">{data.completionRate.toFixed(1)}%</span>
      </p>
    </div>
  )
}