import { supabase } from '../../lib/supabase'
import type { ApiResult, DbInvoice } from '../../lib/types'
import type { Invoice, InvoiceStatus } from './types'

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapDbToInvoice(db: DbInvoice): Invoice {
  const VALID_INVOICE_STATUSES = ['draft', 'issued', 'paid', 'cancelled'] as const
  if (!VALID_INVOICE_STATUSES.includes(db.status as any)) {
    console.warn(`Unexpected invoice status: ${db.status}`)
  }
  return {
    id: db.id,
    number: db.number,
    quoteId: db.quote_id ?? undefined,
    clientId: db.client_id ?? undefined,
    clientName: db.client_name,
    items: db.items as Invoice['items'],
    subtotal: Number(db.subtotal),
    iva: db.iva != null ? Number(db.iva) : undefined,
    discount: db.discount != null ? Number(db.discount) : undefined,
    total: Number(db.total),
    status: db.status as InvoiceStatus,
    notes: db.notes,
    issuedAt: db.issued_at ? new Date(db.issued_at).getTime() : undefined,
    paidAt: db.paid_at ? new Date(db.paid_at).getTime() : undefined,
    dueDate: db.due_date ? new Date(db.due_date).getTime() : undefined,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  }
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getAllInvoices(
  companyId: string,
): Promise<ApiResult<Invoice[]>> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToInvoice), error: null }
}

export async function getInvoiceById(
  id: string,
  companyId: string,
): Promise<ApiResult<Invoice>> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToInvoice(data), error: null }
}

export async function createInvoice(
  invoice: Invoice,
  companyId: string,
): Promise<ApiResult<Invoice>> {
  const dbRow: Record<string, unknown> = {
    id: invoice.id,
    company_id: companyId,
    number: invoice.number,
    client_name: invoice.clientName,
    items: invoice.items,
    subtotal: invoice.subtotal,
    total: invoice.total,
    status: invoice.status,
    notes: invoice.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (invoice.quoteId !== undefined) dbRow.quote_id = invoice.quoteId ?? null
  if (invoice.clientId !== undefined) dbRow.client_id = invoice.clientId ?? null
  if (invoice.iva != null) dbRow.iva = invoice.iva
  if (invoice.discount != null) dbRow.discount = invoice.discount
  if (invoice.issuedAt != null) dbRow.issued_at = new Date(invoice.issuedAt).toISOString()
  if (invoice.paidAt != null) dbRow.paid_at = new Date(invoice.paidAt).toISOString()
  if (invoice.dueDate != null) dbRow.due_date = new Date(invoice.dueDate).toISOString()

  const { data, error } = await supabase
    .from('invoices')
    .insert(dbRow)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToInvoice(data), error: null }
}

export async function updateInvoice(
  id: string,
  data: Partial<Omit<Invoice, 'id' | 'createdAt' | 'number'>>,
  companyId: string,
): Promise<ApiResult<Invoice>> {
  const dbUpdate: Record<string, unknown> = {}
  if (data.quoteId !== undefined) dbUpdate.quote_id = data.quoteId ?? null
  if (data.clientId !== undefined) dbUpdate.client_id = data.clientId ?? null
  if (data.clientName !== undefined) dbUpdate.client_name = data.clientName
  if (data.items !== undefined) dbUpdate.items = data.items
  if (data.subtotal !== undefined) dbUpdate.subtotal = data.subtotal
  if (data.iva !== undefined) dbUpdate.iva = data.iva ?? null
  if (data.discount !== undefined) dbUpdate.discount = data.discount ?? null
  if (data.total !== undefined) dbUpdate.total = data.total
  if (data.status !== undefined) dbUpdate.status = data.status
  if (data.notes !== undefined) dbUpdate.notes = data.notes
  if (data.issuedAt !== undefined) dbUpdate.issued_at = data.issuedAt ? new Date(data.issuedAt).toISOString() : null
  if (data.paidAt !== undefined) dbUpdate.paid_at = data.paidAt ? new Date(data.paidAt).toISOString() : null
  if (data.dueDate !== undefined) dbUpdate.due_date = data.dueDate ? new Date(data.dueDate).toISOString() : null
  dbUpdate.updated_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('invoices')
    .update(dbUpdate)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToInvoice(result), error: null }
}

export async function deleteInvoice(
  id: string,
  companyId: string,
): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}

// ── Status transitions ──────────────────────────────────────────────────────

export async function updateInvoiceStatus(
  id: string,
  companyId: string,
  status: InvoiceStatus,
): Promise<ApiResult<Invoice>> {
  const dbUpdate: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'issued') dbUpdate.issued_at = new Date().toISOString()
  if (status === 'paid') dbUpdate.paid_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('invoices')
    .update(dbUpdate)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToInvoice(data), error: null }
}

// ── Invoice numbering ───────────────────────────────────────────────────────

/**
 * Calls the `next_invoice_number` RPC to atomically allocate the next
 * sequential invoice number for a given company.
 * Requires the `invoices_sequence` table and `next_invoice_number` function
 * to exist in the Supabase project (see supabase-migration.sql).
 */
export async function nextInvoiceNumber(
  companyId: string,
): Promise<ApiResult<string>> {
  const { data, error } = await supabase.rpc('next_invoice_number', {
    p_company_id: companyId,
  })

  if (error) return { data: null, error: error.message }
  return { data: data as string, error: null }
}
