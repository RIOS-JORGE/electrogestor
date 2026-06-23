import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Client } from './types'
import { useToastStore } from '../../shared/hooks/useToast'

interface ClientStore {
  clients: Client[]
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => void
  deleteClient: (id: string) => void
  getClientById: (id: string) => Client | undefined
}

export const useClientStore = create<ClientStore>()(
  persist(
    (set, get) => ({
      clients: [],
      addClient: (client) =>
        set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id, data) =>
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c,
          ),
        })),
      deleteClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        })),
      getClientById: (id) => get().clients.find((c) => c.id === id),
    }),
    {
      name: 'electrogestor-clients',
      onRehydrateStorage: () => (_, error) => {
        if (error) {
          console.error('Error al cargar datos de clientes:', error)
          useToastStore.getState().addToast('Error al cargar datos de clientes guardados', 'error')
        }
      },
    },
  ),
)
