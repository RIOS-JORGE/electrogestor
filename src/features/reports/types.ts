export interface RevenueData {
  period: string
  total: number
  count: number
  average: number
}

export interface ConversionData {
  status: string
  count: number
  percentage: number
}

export interface ClientRankingData {
  clientId: string
  clientName: string
  total: number
  percentage: number
}

export interface AppointmentStatsData {
  completed: number
  cancelled: number
  scheduled: number
  total: number
  completionRate: number
}

export interface InventoryValueData {
  category: string
  totalValue: number
  productCount: number
}

export interface MonthlyTrendData {
  month: string
  invoices: number
  quotes: number
}

export interface DateRange {
  start: Date
  end: Date
  preset?: 'month' | 'quarter' | 'year' | 'custom'
}

export interface ReportData {
  revenue: RevenueData[]
  conversion: ConversionData[]
  clientRanking: ClientRankingData[]
  appointmentStats: AppointmentStatsData
  inventoryValue: InventoryValueData[]
  monthlyTrends: MonthlyTrendData[]
}