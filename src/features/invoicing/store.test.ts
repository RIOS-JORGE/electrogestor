import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInvoiceStore } from './store'
import type { Invoice } from './types'

vi.mock('./api', () => ({
  getAllInvoices: vi.fn(),
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
  updateInvoiceStatus: vi.fn(),
  nextInvoiceNumber: vi.fn(),
}))

import * as api from './api'
import { setCompanyId } from '../../lib/supabase'

function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const now = Date.now()
  return {
    id: 'inv-1',
    number: 'FAC-0001',
    clientName: 'Juan Pérez',
    items: [],
    subtotal: 0,
    total: 0,
    status: 'draft',
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

async function addInvoiceToStore(inv: Invoice): Promise<void> {
  vi.mocked(api.nextInvoiceNumber).mockResolvedValue({ data: inv.number || 'FAC-0001', error: null })
  vi.mocked(api.createInvoice).mockResolvedValue({ data: inv, error: null })
  await useInvoiceStore.getState().addInvoice(inv)
}

beforeEach(() => {
  setCompanyId('test-company')
  useInvoiceStore.setState({ invoices: [], loaded: false })
  vi.clearAllMocks()
})

describe('InvoiceStore', () => {
  describe('loadAll', () => {
    it('sets invoices and loaded=true on success', async () => {
      const invoices = [createInvoice()]
      vi.mocked(api.getAllInvoices).mockResolvedValue({ data: invoices, error: null })

      await useInvoiceStore.getState().loadAll()

      expect(useInvoiceStore.getState().invoices).toEqual(invoices)
      expect(useInvoiceStore.getState().loaded).toBe(true)
    })

    it('does not set loaded on error', async () => {
      vi.mocked(api.getAllInvoices).mockResolvedValue({ data: null, error: 'Network error' })

      await useInvoiceStore.getState().loadAll()

      expect(useInvoiceStore.getState().loaded).toBe(false)
      expect(useInvoiceStore.getState().invoices).toEqual([])
    })
  })

  describe('CRUD', () => {
    it('adds an invoice', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      expect(useInvoiceStore.getState().invoices).toHaveLength(1)
      expect(useInvoiceStore.getState().invoices[0].clientName).toBe('Juan Pérez')
    })

    it('does not add on nextInvoiceNumber error', async () => {
      vi.mocked(api.nextInvoiceNumber).mockResolvedValue({ data: null, error: 'No sequence' })

      await useInvoiceStore.getState().addInvoice(createInvoice())

      expect(useInvoiceStore.getState().invoices).toHaveLength(0)
      expect(api.createInvoice).not.toHaveBeenCalled()
    })

    it('updates an invoice on success', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      const updated = { ...inv, clientName: 'Carlos', updatedAt: Date.now() + 1000 }
      vi.mocked(api.updateInvoice).mockResolvedValue({ data: updated, error: null })

      await useInvoiceStore.getState().updateInvoice(inv.id, { clientName: 'Carlos' })

      const result = useInvoiceStore.getState().getInvoiceById(inv.id)
      expect(result?.clientName).toBe('Carlos')
      expect(result?.updatedAt).toBeGreaterThan(inv.createdAt)
    })

    it('does not update on API error', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      vi.mocked(api.updateInvoice).mockResolvedValue({ data: null, error: 'DB error' })

      await useInvoiceStore.getState().updateInvoice(inv.id, { clientName: 'Carlos' })

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.clientName).toBe('Juan Pérez')
    })

    it('deletes an invoice on success', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      vi.mocked(api.deleteInvoice).mockResolvedValue({ data: undefined, error: null })

      await useInvoiceStore.getState().deleteInvoice(inv.id)

      expect(useInvoiceStore.getState().invoices).toHaveLength(0)
    })

    it('does not delete on API error', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      vi.mocked(api.deleteInvoice).mockResolvedValue({ data: null, error: 'DB error' })

      await useInvoiceStore.getState().deleteInvoice(inv.id)

      expect(useInvoiceStore.getState().invoices).toHaveLength(1)
    })
  })

  describe('state machine', () => {
    it('allows draft → issued', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      const issued = { ...inv, status: 'issued' as const, issuedAt: Date.now() }
      vi.mocked(api.updateInvoiceStatus).mockResolvedValue({ data: issued, error: null })

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'issued')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('issued')
    })

    it('allows issued → paid', async () => {
      const inv = createInvoice({ status: 'issued', issuedAt: Date.now() })
      await addInvoiceToStore(inv)

      const paid = { ...inv, status: 'paid' as const, paidAt: Date.now() }
      vi.mocked(api.updateInvoiceStatus).mockResolvedValue({ data: paid, error: null })

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'paid')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('paid')
    })

    it('allows draft → cancelled', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      const cancelled = { ...inv, status: 'cancelled' as const }
      vi.mocked(api.updateInvoiceStatus).mockResolvedValue({ data: cancelled, error: null })

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'cancelled')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('cancelled')
    })

    it('prevents draft → paid (invalid transition)', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'paid')

      // State must remain unchanged — API should NOT be called
      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('draft')
      expect(api.updateInvoiceStatus).not.toHaveBeenCalled()
    })

    it('prevents paid → any transition', async () => {
      const inv = createInvoice({ status: 'paid', paidAt: Date.now() })
      await addInvoiceToStore(inv)

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'draft')
      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('paid')

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'cancelled')
      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('paid')

      expect(api.updateInvoiceStatus).not.toHaveBeenCalled()
    })

    it('sets issuedAt when transitioning to issued', async () => {
      const inv = createInvoice()
      await addInvoiceToStore(inv)

      const issued = { ...inv, status: 'issued' as const, issuedAt: Date.now() }
      vi.mocked(api.updateInvoiceStatus).mockResolvedValue({ data: issued, error: null })

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'issued')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.issuedAt).toBeDefined()
      expect(typeof useInvoiceStore.getState().getInvoiceById(inv.id)?.issuedAt).toBe('number')
    })

    it('sets paidAt when transitioning to paid', async () => {
      const inv = createInvoice({ status: 'issued', issuedAt: Date.now() })
      await addInvoiceToStore(inv)

      const paid = { ...inv, status: 'paid' as const, paidAt: Date.now() }
      vi.mocked(api.updateInvoiceStatus).mockResolvedValue({ data: paid, error: null })

      await useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'paid')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.paidAt).toBeDefined()
      expect(typeof useInvoiceStore.getState().getInvoiceById(inv.id)?.paidAt).toBe('number')
    })
  })
})
