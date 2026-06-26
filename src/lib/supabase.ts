import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Company ID en memoria (single-tenant) ────────────────────
let _companyId: string | null = null

export function setCompanyId(id: string | null): void {
  _companyId = id
}

/**
 * Returns the currently active company ID.
 * AuthProvider calls setCompanyId() after loading the user's company.
 * @throws If no company is active.
 */
export function getCompanyId(): string {
  if (!_companyId) {
    throw new Error('No hay una empresa activa. Iniciá sesión.')
  }
  return _companyId
}

/**
 * Check if an active company is set.
 */
export function hasActiveCompany(): boolean {
  return _companyId !== null
}
