import { describe, it, expect, beforeEach } from 'vitest'
import { useInvoiceStore } from './store'
import type { Invoice } from './types'

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

beforeEach(() => {
  localStorage.clear()
  useInvoiceStore.setState({ invoices: [] })
})

describe('InvoiceStore', () => {
  describe('CRUD', () => {
    it('adds an invoice', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)

      expect(useInvoiceStore.getState().invoices).toHaveLength(1)
      expect(useInvoiceStore.getState().invoices[0].clientName).toBe('Juan Pérez')
    })

    it('updates an invoice', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)

      useInvoiceStore.getState().updateInvoice(inv.id, { clientName: 'Carlos' })
      const updated = useInvoiceStore.getState().getInvoiceById(inv.id)
      expect(updated?.clientName).toBe('Carlos')
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(inv.createdAt)
    })

    it('deletes an invoice', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().deleteInvoice(inv.id)

      expect(useInvoiceStore.getState().invoices).toHaveLength(0)
    })
  })

  describe('getNextNumber', () => {
    it('returns FAC-0001 when no invoices exist', () => {
      expect(useInvoiceStore.getState().getNextNumber()).toBe('FAC-0001')
    })

    it('generates sequential numbers', () => {
      useInvoiceStore.getState().addInvoice(createInvoice({ number: 'FAC-0001' }))
      expect(useInvoiceStore.getState().getNextNumber()).toBe('FAC-0002')

      useInvoiceStore.getState().addInvoice(
        createInvoice({ id: 'inv-2', number: 'FAC-0002' }),
      )
      expect(useInvoiceStore.getState().getNextNumber()).toBe('FAC-0003')
    })

    it('handles non-standard number format gracefully', () => {
      useInvoiceStore.getState().addInvoice(createInvoice({ number: 'FAC-abc' }))
      // regex doesn't match → max stays 0 → returns FAC-0001
      expect(useInvoiceStore.getState().getNextNumber()).toBe('FAC-0001')
    })
  })

  describe('state machine', () => {
    it('allows draft → issued', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'issued')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('issued')
    })

    it('allows issued → paid', () => {
      const inv = createInvoice({ status: 'issued', issuedAt: Date.now() })
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'paid')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('paid')
    })

    it('allows draft → cancelled', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'cancelled')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('cancelled')
    })

    it('prevents draft → paid (invalid transition)', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'paid')

      // State must remain unchanged
      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('draft')
    })

    it('prevents paid → any transition', () => {
      const inv = createInvoice({ status: 'paid', paidAt: Date.now() })
      useInvoiceStore.getState().addInvoice(inv)

      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'draft')
      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('paid')

      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'cancelled')
      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.status).toBe('paid')
    })

    it('sets issuedAt when transitioning to issued', () => {
      const inv = createInvoice()
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'issued')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.issuedAt).toBeDefined()
      expect(typeof useInvoiceStore.getState().getInvoiceById(inv.id)?.issuedAt).toBe('number')
    })

    it('sets paidAt when transitioning to paid', () => {
      const inv = createInvoice({ status: 'issued', issuedAt: Date.now() })
      useInvoiceStore.getState().addInvoice(inv)
      useInvoiceStore.getState().updateInvoiceStatus(inv.id, 'paid')

      expect(useInvoiceStore.getState().getInvoiceById(inv.id)?.paidAt).toBeDefined()
      expect(typeof useInvoiceStore.getState().getInvoiceById(inv.id)?.paidAt).toBe('number')
    })
  })
})
