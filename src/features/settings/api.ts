import { supabase } from '../../lib/supabase'
import type { ApiResult, DbSettings } from '../../lib/types'
import type { Settings } from './types'

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapDbToSettings(db: DbSettings): Settings {
  return {
    mpAlias: db.mp_alias,
    businessName: db.business_name,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  }
}

// ── Read ────────────────────────────────────────────────────────────────────

/**
 * Fetches the settings for the given company.
 * Returns `{ data: null, error: null }` if no settings exist (not an error).
 */
export async function getSettings(
  companyId: string,
): Promise<ApiResult<Settings>> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }
  return { data: mapDbToSettings(data), error: null }
}

// ── Upsert ──────────────────────────────────────────────────────────────────

/**
 * Creates or updates the settings for a company.
 * Uses the `company_id` unique constraint to upsert — if a row already
 * exists for this company, it is updated; otherwise a new row is inserted.
 */
export async function upsertSettings(
  companyId: string,
  data: Partial<Settings>,
): Promise<ApiResult<Settings>> {
  const dbRow: Record<string, unknown> = {
    company_id: companyId,
    updated_at: new Date().toISOString(),
  }
  if (data.mpAlias !== undefined) dbRow.mp_alias = data.mpAlias
  if (data.businessName !== undefined) dbRow.business_name = data.businessName

  const { data: result, error } = await supabase
    .from('settings')
    .upsert(dbRow, { onConflict: 'company_id' })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToSettings(result), error: null }
}
