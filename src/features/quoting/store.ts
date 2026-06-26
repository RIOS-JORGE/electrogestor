import { create } from 'zustand'
import type { Quote } from './types'
import { getCompanyId } from '../../lib/supabase'
import {
  getAllQuotes,
  createQuote as apiCreateQuote,
  updateQuote as apiUpdateQuote,
  deleteQuote as apiDeleteQuote,
  updateQuoteStatus as apiUpdateQuoteStatus,
} from './api'
import { useToastStore } from '../../shared/hooks/useToast'

interface QuoteStore {
  quotes: Quote[]
  loaded: boolean
  loadAll: () => Promise<void>
  addQuote: (quote: Quote) => Promise<void>
  updateQuote: (id: string, data: Partial<Omit<Quote, 'id' | 'createdAt'>>) => Promise<void>
  deleteQuote: (id: string) => Promise<void>
  getQuoteById: (id: string) => Quote | undefined
  updateQuoteStatus: (id: string, status: Quote['status']) => Promise<void>
}

export const useQuoteStore = create<QuoteStore>()((set, get) => ({
  quotes: [],
  loaded: false,

  loadAll: async () => {
    try {
      const companyId = getCompanyId()
      const result = await getAllQuotes(companyId)
      if (result.data) {
        set({ quotes: result.data, loaded: true })
      } else {
        console.error('Error al cargar presupuestos:', result.error)
      }
    } catch (err) {
      console.error('Error al cargar presupuestos:', err)
    }
  },

  addQuote: async (quote) => {
    const companyId = getCompanyId()
    const result = await apiCreateQuote(quote, companyId)
    if (result.data) {
      set((state) => ({ quotes: [...state.quotes, result.data!] }))
    } else {
      useToastStore.getState().addToast('Error al guardar presupuesto', 'error')
      throw new Error(result.error ?? 'Error al guardar presupuesto')
    }
  },

  updateQuote: async (id, data) => {
    const companyId = getCompanyId()
    const result = await apiUpdateQuote(id, data, companyId)
    if (result.data) {
      set((state) => ({
        quotes: state.quotes.map((q) =>
          q.id === id ? result.data! : q,
        ),
      }))
    } else {
      useToastStore.getState().addToast('Error al actualizar presupuesto', 'error')
      throw new Error(result.error ?? 'Error al actualizar presupuesto')
    }
  },

  deleteQuote: async (id) => {
    try {
      const companyId = getCompanyId()
      const result = await apiDeleteQuote(id, companyId)
      if (!result.error) {
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }))
      } else {
        useToastStore.getState().addToast('Error al eliminar presupuesto', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al eliminar presupuesto', 'error')
    }
  },

  getQuoteById: (id) => get().quotes.find((q) => q.id === id),

  updateQuoteStatus: async (id, status) => {
    try {
      const companyId = getCompanyId()
      const result = await apiUpdateQuoteStatus(id, companyId, status)
      if (result.data) {
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? result.data! : q,
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
