import { useMemo } from 'react'
import { useInvoiceStore } from '../../../features/invoicing/store'
import { useQuoteStore } from '../../../features/quoting/store'
import { useAppointmentStore } from '../../../features/scheduling/store'
import { useInventoryStore } from '../../../features/inventory/store'
import type { DateRange, ReportData } from '../types'

export function useReportData(dateRange?: DateRange): ReportData {
  const invoices = useInvoiceStore((s) => s.invoices)
  const quotes = useQuoteStore((s) => s.quotes)
  const appointments = useAppointmentStore((s) => s.appointments)
  const products = useInventoryStore((s) => s.products)

  // Filter by date range if provided
  const filteredInvoices = useMemo(() => {
    if (!dateRange) return invoices
    return invoices.filter((inv) => {
      const date = inv.paidAt || inv.createdAt
      return date >= dateRange.start.getTime() && date <= dateRange.end.getTime()
    })
  }, [invoices, dateRange])

  const filteredQuotes = useMemo(() => {
    if (!dateRange) return quotes
    return quotes.filter((q) => {
      return q.createdAt >= dateRange.start.getTime() && q.createdAt <= dateRange.end.getTime()
    })
  }, [quotes, dateRange])

  const filteredAppointments = useMemo(() => {
    if (!dateRange) return appointments
    return appointments.filter((a) => {
      const date = new Date(a.date).getTime()
      return date >= dateRange.start.getTime() && date <= dateRange.end.getTime()
    })
  }, [appointments, dateRange])

  // Revenue: paid invoices by month
  const revenue = useMemo(() => {
    const paid = filteredInvoices.filter((inv) => inv.status === 'paid')
    const grouped: Record<string, { total: number; count: number }> = {}
    
    paid.forEach((inv) => {
      const date = new Date(inv.paidAt || inv.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!grouped[key]) grouped[key] = { total: 0, count: 0 }
      grouped[key].total += inv.total
      grouped[key].count += 1
    })

    return Object.entries(grouped)
      .map(([period, data]) => ({
        period,
        total: data.total,
        count: data.count,
        average: data.total / data.count
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }, [filteredInvoices])

  // Conversion: quote status distribution
  const conversion = useMemo(() => {
    const total = filteredQuotes.length
    if (total === 0) return []

    const grouped: Record<string, number> = {}
    filteredQuotes.forEach((q) => {
      grouped[q.status] = (grouped[q.status] || 0) + 1
    })

    return Object.entries(grouped).map(([status, count]) => ({
      status,
      count,
      percentage: (count / total) * 100
    }))
  }, [filteredQuotes])

  // Client ranking: top 10 by invoiced amount
  const clientRanking = useMemo(() => {
    const paid = filteredInvoices.filter((inv) => inv.status === 'paid')
    const totalRevenue = paid.reduce((sum, inv) => sum + inv.total, 0)
    
    const grouped: Record<string, { name: string; total: number }> = {}
    paid.forEach((inv) => {
      const id = inv.clientId || 'unknown'
      if (!grouped[id]) grouped[id] = { name: inv.clientName, total: 0 }
      grouped[id].total += inv.total
    })

    return Object.entries(grouped)
      .map(([clientId, data]) => ({
        clientId,
        clientName: data.name,
        total: data.total,
        percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [filteredInvoices])

  // Appointment stats
  const appointmentStats = useMemo(() => {
    const total = filteredAppointments.length
    const completed = filteredAppointments.filter((a) => a.status === 'completed').length
    const cancelled = filteredAppointments.filter((a) => a.status === 'cancelled').length
    const scheduled = filteredAppointments.filter((a) => a.status === 'scheduled').length

    return {
      completed,
      cancelled,
      scheduled,
      total,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    }
  }, [filteredAppointments])

  // Inventory value by category
  const inventoryValue = useMemo(() => {
    const grouped: Record<string, { totalValue: number; productCount: number }> = {}
    
    products.forEach((p) => {
      const cat = p.category || 'Sin categoría'
      if (!grouped[cat]) grouped[cat] = { totalValue: 0, productCount: 0 }
      grouped[cat].totalValue += p.stock * (p.unitPrice || 0)
      grouped[cat].productCount += 1
    })

    return Object.entries(grouped).map(([category, data]) => ({
      category,
      totalValue: data.totalValue,
      productCount: data.productCount
    }))
  }, [products])

  // Monthly trends: invoices + quotes per month
  const monthlyTrends = useMemo(() => {
    const months = new Map<string, { invoices: number; quotes: number }>()

    filteredInvoices.forEach((inv) => {
      const date = new Date(inv.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!months.has(key)) months.set(key, { invoices: 0, quotes: 0 })
      months.get(key)!.invoices += 1
    })

    filteredQuotes.forEach((q) => {
      const date = new Date(q.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!months.has(key)) months.set(key, { invoices: 0, quotes: 0 })
      months.get(key)!.quotes += 1
    })

    return Array.from(months.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [filteredInvoices, filteredQuotes])

  return { revenue, conversion, clientRanking, appointmentStats, inventoryValue, monthlyTrends }
}