import { create } from 'zustand'
import type { Invoice, InvoiceStatus } from './types'
import { getCompanyId } from '../../lib/supabase'
import {
  getAllInvoices,
  createInvoice as apiCreateInvoice,
  updateInvoice as apiUpdateInvoice,
  deleteInvoice as apiDeleteInvoice,
  updateInvoiceStatus as apiUpdateInvoiceStatus,
  nextInvoiceNumber,
} from './api'
import { useToastStore } from '../../shared/hooks/useToast'

// ── State machine: which transitions are allowed ─────────────────────────────

const VALID_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  draft: ['issued', 'cancelled'] as const,
  issued: ['paid', 'cancelled'] as const,
  paid: [] as const,
  cancelled: [] as const,
}

// ── Store interface ──────────────────────────────────────────────────────────

interface InvoiceStore {
  invoices: Invoice[]
  loaded: boolean
  loadAll: () => Promise<void>
  addInvoice: (invoice: Invoice) => Promise<void>
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt'>>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>
  getInvoiceById: (id: string) => Invoice | undefined
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>
}

// ── Store implementation ─────────────────────────────────────────────────────

export const useInvoiceStore = create<InvoiceStore>()((set, get) => ({
  invoices: [],
  loaded: false,

  loadAll: async () => {
    try {
      const companyId = getCompanyId()
      const result = await getAllInvoices(companyId)
      if (result.data) {
        set({ invoices: result.data, loaded: true })
      } else {
        console.error('Error al cargar facturas:', result.error)
      }
    } catch (err) {
      console.error('Error al cargar facturas:', err)
    }
  },

  addInvoice: async (invoice) => {
    const companyId = getCompanyId()

    // Get the next sequential number from the server
    const numResult = await nextInvoiceNumber(companyId)
    if (numResult.error || !numResult.data) {
      useToastStore.getState().addToast('Error al generar número de factura', 'error')
      throw new Error(numResult.error ?? 'Error al generar número de factura')
    }

    const invoiceWithNumber = { ...invoice, number: numResult.data }
    const result = await apiCreateInvoice(invoiceWithNumber, companyId)
    if (result.data) {
      set((state) => ({ invoices: [...state.invoices, result.data!] }))
    } else {
      useToastStore.getState().addToast('Error al guardar factura', 'error')
      throw new Error(result.error ?? 'Error al guardar factura')
    }
  },

  updateInvoice: async (id, data) => {
    const companyId = getCompanyId()
    const result = await apiUpdateInvoice(id, data, companyId)
    if (result.data) {
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === id ? result.data! : inv,
        ),
      }))
    } else {
      useToastStore.getState().addToast('Error al actualizar factura', 'error')
      throw new Error(result.error ?? 'Error al actualizar factura')
    }
  },

  deleteInvoice: async (id) => {
    try {
      const companyId = getCompanyId()
      const result = await apiDeleteInvoice(id, companyId)
      if (!result.error) {
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }))
      } else {
        useToastStore.getState().addToast('Error al eliminar factura', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al eliminar factura', 'error')
    }
  },

  getInvoiceById: (id) => get().invoices.find((inv) => inv.id === id),

  updateInvoiceStatus: async (id, status) => {
    const invoice = get().invoices.find((inv) => inv.id === id)
    if (!invoice) return

    const allowed = VALID_TRANSITIONS[invoice.status]
    if (!allowed.includes(status)) {
      useToastStore.getState().addToast('No se puede cambiar el estado', 'error')
      return
    }

    try {
      const companyId = getCompanyId()
      const result = await apiUpdateInvoiceStatus(id, companyId, status)
      if (result.data) {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? result.data! : inv,
          ),
        }))
      } else {
        useToastStore.getState().addToast('Error al actualizar estado', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al actualizar estado', 'error')
    }
  },
}))
