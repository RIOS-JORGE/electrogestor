import { supabase } from '../../lib/supabase'
import type { ApiResult, DbClient } from '../../lib/types'
import type { Client } from './types'

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapDbToClient(db: DbClient): Client {
  return {
    id: db.id,
    name: db.name,
    phone: db.phone,
    email: db.email,
    address: db.address,
    notes: db.notes,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  }
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getAllClients(companyId: string): Promise<ApiResult<Client[]>> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToClient), error: null }
}

export async function getClientById(
  id: string,
  companyId: string,
): Promise<ApiResult<Client>> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToClient(data), error: null }
}

export async function createClient(
  client: Client,
  companyId: string,
): Promise<ApiResult<Client>> {
  const dbRow = {
    id: client.id,
    company_id: companyId,
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address,
    notes: client.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(dbRow)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToClient(data), error: null }
}

export async function updateClient(
  id: string,
  data: Partial<Omit<Client, 'id' | 'createdAt'>>,
  companyId: string,
): Promise<ApiResult<Client>> {
  const dbUpdate: Record<string, unknown> = {}
  if (data.name !== undefined) dbUpdate.name = data.name
  if (data.phone !== undefined) dbUpdate.phone = data.phone
  if (data.email !== undefined) dbUpdate.email = data.email
  if (data.address !== undefined) dbUpdate.address = data.address
  if (data.notes !== undefined) dbUpdate.notes = data.notes
  dbUpdate.updated_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('clients')
    .update(dbUpdate)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToClient(result), error: null }
}

export async function deleteClient(
  id: string,
  companyId: string,
): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}
