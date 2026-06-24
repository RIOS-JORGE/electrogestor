import { useState } from 'react'
import { useReportData } from './hooks/useReportData'
import { ReportCard } from './components/ReportCard'
import { DateRangeFilter } from './components/DateRangeFilter'
import { RevenueChart } from './components/RevenueChart'
import { ConversionFunnel } from './components/ConversionFunnel'
import { ClientRanking } from './components/ClientRanking'
import { AppointmentStats } from './components/AppointmentStats'
import { InventoryValue } from './components/InventoryValue'
import { MonthlyTrends } from './components/MonthlyTrends'
import type { DateRange } from './types'

function getDefaultRange(): DateRange {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    preset: 'month'
  }
}

export default function ReportesPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange)
  const data = useReportData(dateRange)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reportes
        </h1>
      </div>

      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      <div className="grid gap-6 md:grid-cols-2">
        <ReportCard title="Ingresos">
          <RevenueChart data={data.revenue} />
        </ReportCard>

        <ReportCard title="Conversión de Cotizaciones">
          <ConversionFunnel data={data.conversion} />
        </ReportCard>

        <ReportCard title="Ranking de Clientes">
          <ClientRanking data={data.clientRanking} />
        </ReportCard>

        <ReportCard title="Utilización de Turnos">
          <AppointmentStats data={data.appointmentStats} />
        </ReportCard>

        <ReportCard title="Valor del Inventario">
          <InventoryValue data={data.inventoryValue} />
        </ReportCard>

        <ReportCard title="Tendencias Mensuales">
          <MonthlyTrends data={data.monthlyTrends} />
        </ReportCard>
      </div>
    </div>
  )
}