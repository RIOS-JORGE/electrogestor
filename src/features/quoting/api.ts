import { supabase } from '../../lib/supabase'
import type { ApiResult, DbQuote } from '../../lib/types'
import type { Quote, QuoteStatus } from './types'

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapDbToQuote(db: DbQuote): Quote {
  const VALID_QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const
  if (!VALID_QUOTE_STATUSES.includes(db.status as any)) {
    console.warn(`Unexpected quote status: ${db.status}`)
  }
  return {
    id: db.id,
    clientId: db.client_id ?? undefined,
    clientName: db.client_name,
    items: db.items as Quote['items'],
    subtotal: Number(db.subtotal),
    iva: db.iva != null ? Number(db.iva) : undefined,
    discount: db.discount != null ? Number(db.discount) : undefined,
    total: Number(db.total),
    status: db.status as QuoteStatus,
    notes: db.notes,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  }
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getAllQuotes(companyId: string): Promise<ApiResult<Quote[]>> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToQuote), error: null }
}

export async function getQuoteById(
  id: string,
  companyId: string,
): Promise<ApiResult<Quote>> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToQuote(data), error: null }
}

export async function createQuote(
  quote: Quote,
  companyId: string,
): Promise<ApiResult<Quote>> {
  const dbRow: Record<string, unknown> = {
    id: quote.id,
    company_id: companyId,
    client_name: quote.clientName,
    items: quote.items,
    subtotal: quote.subtotal,
    total: quote.total,
    status: quote.status,
    notes: quote.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (quote.clientId !== undefined) dbRow.client_id = quote.clientId ?? null
  if (quote.iva != null) dbRow.iva = quote.iva
  if (quote.discount != null) dbRow.discount = quote.discount

  const { data, error } = await supabase
    .from('quotes')
    .insert(dbRow)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToQuote(data), error: null }
}

export async function updateQuote(
  id: string,
  data: Partial<Omit<Quote, 'id' | 'createdAt'>>,
  companyId: string,
): Promise<ApiResult<Quote>> {
  const dbUpdate: Record<string, unknown> = {}
  if (data.clientId !== undefined) dbUpdate.client_id = data.clientId ?? null
  if (data.clientName !== undefined) dbUpdate.client_name = data.clientName
  if (data.items !== undefined) dbUpdate.items = data.items
  if (data.subtotal !== undefined) dbUpdate.subtotal = data.subtotal
  if (data.iva !== undefined) dbUpdate.iva = data.iva ?? null
  if (data.discount !== undefined) dbUpdate.discount = data.discount ?? null
  if (data.total !== undefined) dbUpdate.total = data.total
  if (data.status !== undefined) dbUpdate.status = data.status
  if (data.notes !== undefined) dbUpdate.notes = data.notes
  dbUpdate.updated_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('quotes')
    .update(dbUpdate)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToQuote(result), error: null }
}

export async function deleteQuote(
  id: string,
  companyId: string,
): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}

// ── Status transitions ──────────────────────────────────────────────────────

export async function updateQuoteStatus(
  id: string,
  companyId: string,
  status: QuoteStatus,
): Promise<ApiResult<Quote>> {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToQuote(data), error: null }
}
