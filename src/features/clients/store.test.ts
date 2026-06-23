import { describe, it, expect, beforeEach } from 'vitest'
import { useClientStore } from './store'
import type { Client } from './types'

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
  localStorage.clear()
  useClientStore.setState({ clients: [] })
})

describe('ClientStore', () => {
  it('adds a client', () => {
    const client = createClient()
    useClientStore.getState().addClient(client)

    const clients = useClientStore.getState().clients
    expect(clients).toHaveLength(1)
    expect(clients[0].name).toBe('Juan Pérez')
  })

  it('updates a client', () => {
    const client = createClient()
    useClientStore.getState().addClient(client)

    useClientStore.getState().updateClient(client.id, { name: 'Carlos López' })
    const updated = useClientStore.getState().getClientById(client.id)
    expect(updated?.name).toBe('Carlos López')
    expect(updated?.updatedAt).toBeGreaterThanOrEqual(client.createdAt)
  })

  it('deletes a client', () => {
    const client = createClient()
    useClientStore.getState().addClient(client)
    useClientStore.getState().deleteClient(client.id)

    expect(useClientStore.getState().clients).toHaveLength(0)
  })

  it('returns undefined for getClientById with unknown id', () => {
    expect(useClientStore.getState().getClientById('nonexistent')).toBeUndefined()
  })

  it('keeps other clients when deleting one', () => {
    const client1 = createClient()
    const client2 = createClient({ id: 'client-2', name: 'María García' })
    useClientStore.getState().addClient(client1)
    useClientStore.getState().addClient(client2)

    useClientStore.getState().deleteClient(client1.id)

    const remaining = useClientStore.getState().clients
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('client-2')
  })
})
