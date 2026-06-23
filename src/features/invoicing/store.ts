import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Invoice, InvoiceStatus } from './types'
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
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt'>>) => void
  deleteInvoice: (id: string) => void
  getInvoiceById: (id: string) => Invoice | undefined
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void
  getNextNumber: () => string
}

// ── Store implementation ─────────────────────────────────────────────────────

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: [],

      addInvoice: (invoice) =>
        set((state) => ({ invoices: [...state.invoices, invoice] })),

      updateInvoice: (id, data) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...data, updatedAt: Date.now() } : inv,
          ),
        })),

      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        })),

      getInvoiceById: (id) => get().invoices.find((inv) => inv.id === id),

      updateInvoiceStatus: (id, status) => {
        const invoice = get().invoices.find((inv) => inv.id === id)
        if (!invoice) return

        const allowed = VALID_TRANSITIONS[invoice.status]
        if (!allowed.includes(status)) {
          useToastStore.getState().addToast('No se puede cambiar el estado', 'error')
          return
        }

        const extra: Partial<Invoice> = { status, updatedAt: Date.now() }
        if (status === 'issued') extra.issuedAt = Date.now()
        if (status === 'paid') extra.paidAt = Date.now()

        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...extra } : inv,
          ),
        }))
      },

      getNextNumber: () => {
        const { invoices } = get()
        const maxNum = invoices.reduce((max, inv) => {
          const match = inv.number.match(/FAC-(\d+)$/)
          const num = match ? parseInt(match[1], 10) : 0
          return num > max ? num : max
        }, 0)
        return `FAC-${String(maxNum + 1).padStart(4, '0')}`
      },
    }),
    {
      name: 'electrogestor-invoices',
      onRehydrateStorage: () => (_, error) => {
        if (error) {
          console.error('Error al cargar datos de facturas:', error)
          useToastStore.getState().addToast(
            'Error al cargar datos de facturas guardados',
            'error',
          )
        }
      },
    },
  ),
)
