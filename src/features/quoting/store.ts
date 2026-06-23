import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Quote } from './types'
import { useToastStore } from '../../shared/hooks/useToast'

interface QuoteStore {
  quotes: Quote[]
  addQuote: (quote: Quote) => void
  updateQuote: (id: string, data: Partial<Omit<Quote, 'id' | 'createdAt'>>) => void
  deleteQuote: (id: string) => void
  getQuoteById: (id: string) => Quote | undefined
  updateQuoteStatus: (id: string, status: Quote['status']) => void
}

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      quotes: [],
      addQuote: (quote) =>
        set((state) => ({ quotes: [...state.quotes, quote] })),
      updateQuote: (id, data) =>
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, ...data, updatedAt: Date.now() } : q,
          ),
        })),
      deleteQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        })),
      getQuoteById: (id) => get().quotes.find((q) => q.id === id),
      updateQuoteStatus: (id, status) =>
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, status, updatedAt: Date.now() } : q,
          ),
        })),
    }),
    {
      name: 'electrogestor-quotes',
      onRehydrateStorage: () => (_, error) => {
        if (error) {
          console.error('Error al cargar datos de presupuestos:', error)
          useToastStore.getState().addToast('Error al cargar datos de presupuestos guardados', 'error')
        }
      },
    },
  ),
)
