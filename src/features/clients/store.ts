import { create } from 'zustand'
import type { Client } from './types'
import { getCompanyId } from '../../lib/supabase'
import { getAllClients, createClient as apiCreateClient, updateClient as apiUpdateClient, deleteClient as apiDeleteClient } from './api'
import { useToastStore } from '../../shared/hooks/useToast'

interface ClientStore {
  clients: Client[]
  loaded: boolean
  loadAll: () => Promise<void>
  addClient: (client: Client) => Promise<void>
  updateClient: (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  getClientById: (id: string) => Client | undefined
}

export const useClientStore = create<ClientStore>()((set, get) => ({
  clients: [],
  loaded: false,

  loadAll: async () => {
    try {
      const companyId = getCompanyId()
      const result = await getAllClients(companyId)
      if (result.data) {
        set({ clients: result.data, loaded: true })
      } else {
        console.error('Error al cargar clientes:', result.error)
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err)
    }
  },

  addClient: async (client) => {
    const companyId = getCompanyId()
    const result = await apiCreateClient(client, companyId)
    if (result.data) {
      set((state) => ({ clients: [...state.clients, result.data!] }))
    } else {
      useToastStore.getState().addToast('Error al guardar cliente', 'error')
      throw new Error(result.error ?? 'Error al guardar cliente')
    }
  },

  updateClient: async (id, data) => {
    const companyId = getCompanyId()
    const result = await apiUpdateClient(id, data, companyId)
    if (result.data) {
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === id ? result.data! : c,
        ),
      }))
    } else {
      useToastStore.getState().addToast('Error al actualizar cliente', 'error')
      throw new Error(result.error ?? 'Error al actualizar cliente')
    }
  },

  deleteClient: async (id) => {
    try {
      const companyId = getCompanyId()
      const result = await apiDeleteClient(id, companyId)
      if (!result.error) {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }))
      } else {
        useToastStore.getState().addToast('Error al eliminar cliente', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al eliminar cliente', 'error')
    }
  },

  getClientById: (id) => get().clients.find((c) => c.id === id),
}))
