import { supabase } from '../../lib/supabase'
import type { ApiResult, DbAppointment } from '../../lib/types'
import type { Appointment, AppointmentStatus } from './types'

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapDbToAppointment(db: DbAppointment): Appointment {
  const VALID_APPOINTMENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const
  if (!VALID_APPOINTMENT_STATUSES.includes(db.status as any)) {
    console.warn(`Unexpected appointment status: ${db.status}`)
  }
  return {
    id: db.id,
    title: db.title,
    clientName: db.client_name,
    clientId: db.client_id ?? undefined,
    quoteId: db.quote_id ?? undefined,
    date: db.date,
    time: db.time ?? undefined,
    duration: db.duration_minutes ?? undefined,
    notes: db.notes ?? undefined,
    address: db.address ?? undefined,
    status: db.status as AppointmentStatus,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  }
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function getAllAppointments(
  companyId: string,
): Promise<ApiResult<Appointment[]>> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToAppointment), error: null }
}

export async function getAppointmentById(
  id: string,
  companyId: string,
): Promise<ApiResult<Appointment>> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToAppointment(data), error: null }
}

export async function createAppointment(
  appointment: Appointment,
  companyId: string,
): Promise<ApiResult<Appointment>> {
  const dbRow: Record<string, unknown> = {
    id: appointment.id,
    company_id: companyId,
    title: appointment.title,
    client_name: appointment.clientName,
    date: appointment.date,
    status: appointment.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (appointment.clientId !== undefined) dbRow.client_id = appointment.clientId ?? null
  if (appointment.quoteId !== undefined) dbRow.quote_id = appointment.quoteId ?? null
  if (appointment.time) dbRow.time = appointment.time
  if (appointment.duration != null) dbRow.duration_minutes = appointment.duration
  if (appointment.notes) dbRow.notes = appointment.notes
  if (appointment.address) dbRow.address = appointment.address

  const { data, error } = await supabase
    .from('appointments')
    .insert(dbRow)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToAppointment(data), error: null }
}

export async function updateAppointment(
  id: string,
  data: Partial<Omit<Appointment, 'id' | 'createdAt'>>,
  companyId: string,
): Promise<ApiResult<Appointment>> {
  const dbUpdate: Record<string, unknown> = {}
  if (data.title !== undefined) dbUpdate.title = data.title
  if (data.clientId !== undefined) dbUpdate.client_id = data.clientId ?? null
  if (data.clientName !== undefined) dbUpdate.client_name = data.clientName
  if (data.quoteId !== undefined) dbUpdate.quote_id = data.quoteId ?? null
  if (data.date !== undefined) dbUpdate.date = data.date
  if (data.time !== undefined) dbUpdate.time = data.time ?? null
  if (data.duration !== undefined) dbUpdate.duration_minutes = data.duration ?? null
  if (data.notes !== undefined) dbUpdate.notes = data.notes ?? null
  if (data.address !== undefined) dbUpdate.address = data.address ?? null
  if (data.status !== undefined) dbUpdate.status = data.status
  dbUpdate.updated_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('appointments')
    .update(dbUpdate)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToAppointment(result), error: null }
}

export async function deleteAppointment(
  id: string,
  companyId: string,
): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}

// ── Status transitions ──────────────────────────────────────────────────────

export async function updateAppointmentStatus(
  id: string,
  companyId: string,
  status: AppointmentStatus,
): Promise<ApiResult<Appointment>> {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToAppointment(data), error: null }
}
