import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useClientStore } from './store'
import type { Client } from './types'

vi.mock('./api', () => ({
  getAllClients: vi.fn(),
  createClient: vi.fn(),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
}))

import * as api from './api'
import { setCompanyId } from '../../lib/supabase'

function createClient(overrides: Partial<Client> = {}): Client {
  const now = Date.now()
  return {
    id: 'client-1',
    name: 'Juan Pérez',
    phone: '123456789',
    email: 'juan@example.com',
    address: 'Av. Siempre Viva 742',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

beforeEach(() => {
  setCompanyId('test-company')
  useClientStore.setState({ clients: [], loaded: false })
  vi.clearAllMocks()
})

describe('ClientStore', () => {
  describe('loadAll', () => {
    it('sets clients and loaded=true on success', async () => {
      const clients = [createClient()]
      vi.mocked(api.getAllClients).mockResolvedValue({ data: clients, error: null })

      await useClientStore.getState().loadAll()

      expect(useClientStore.getState().clients).toEqual(clients)
      expect(useClientStore.getState().loaded).toBe(true)
    })

    it('does not set loaded on error', async () => {
      vi.mocked(api.getAllClients).mockResolvedValue({ data: null, error: 'Network error' })

      await useClientStore.getState().loadAll()

      expect(useClientStore.getState().loaded).toBe(false)
      expect(useClientStore.getState().clients).toEqual([])
    })
  })

  describe('addClient', () => {
    it('adds a client to the store on success', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: client, error: null })

      await useClientStore.getState().addClient(client)

      const clients = useClientStore.getState().clients
      expect(clients).toHaveLength(1)
      expect(clients[0].name).toBe('Juan Pérez')
    })

    it('does not add a client on API error', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: null, error: 'DB error' })

      await expect(useClientStore.getState().addClient(client)).rejects.toThrow('DB error')

      expect(useClientStore.getState().clients).toHaveLength(0)
    })
  })

  describe('updateClient', () => {
    it('updates a client in the store on success', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: client, error: null })
      await useClientStore.getState().addClient(client)

      const updated = { ...client, name: 'Carlos López', updatedAt: Date.now() + 1000 }
      vi.mocked(api.updateClient).mockResolvedValue({ data: updated, error: null })

      await useClientStore.getState().updateClient(client.id, { name: 'Carlos López' })

      const result = useClientStore.getState().getClientById(client.id)
      expect(result?.name).toBe('Carlos López')
      expect(result?.updatedAt).toBeGreaterThan(client.createdAt)
    })

    it('does not update on API error', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: client, error: null })
      await useClientStore.getState().addClient(client)

      vi.mocked(api.updateClient).mockResolvedValue({ data: null, error: 'DB error' })

      await expect(useClientStore.getState().updateClient(client.id, { name: 'Carlos López' })).rejects.toThrow('DB error')

      expect(useClientStore.getState().getClientById(client.id)?.name).toBe('Juan Pérez')
    })
  })

  describe('deleteClient', () => {
    it('removes a client from the store on success', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: client, error: null })
      await useClientStore.getState().addClient(client)

      vi.mocked(api.deleteClient).mockResolvedValue({ data: undefined, error: null })

      await useClientStore.getState().deleteClient(client.id)

      expect(useClientStore.getState().clients).toHaveLength(0)
    })

    it('keeps other clients when deleting one', async () => {
      const client1 = createClient()
      const client2 = createClient({ id: 'client-2', name: 'María García' })
      vi.mocked(api.createClient).mockResolvedValueOnce({ data: client1, error: null })
      vi.mocked(api.createClient).mockResolvedValueOnce({ data: client2, error: null })

      await useClientStore.getState().addClient(client1)
      await useClientStore.getState().addClient(client2)

      vi.mocked(api.deleteClient).mockResolvedValue({ data: undefined, error: null })

      await useClientStore.getState().deleteClient(client1.id)

      const remaining = useClientStore.getState().clients
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe('client-2')
    })

    it('does not remove on API error', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: client, error: null })
      await useClientStore.getState().addClient(client)

      vi.mocked(api.deleteClient).mockResolvedValue({ data: null, error: 'DB error' })

      await useClientStore.getState().deleteClient(client.id)

      expect(useClientStore.getState().clients).toHaveLength(1)
    })
  })

  describe('getClientById', () => {
    it('returns undefined for unknown id', () => {
      expect(useClientStore.getState().getClientById('nonexistent')).toBeUndefined()
    })

    it('returns the matching client', async () => {
      const client = createClient()
      vi.mocked(api.createClient).mockResolvedValue({ data: client, error: null })
      await useClientStore.getState().addClient(client)

      expect(useClientStore.getState().getClientById(client.id)?.name).toBe('Juan Pérez')
    })
  })
})
