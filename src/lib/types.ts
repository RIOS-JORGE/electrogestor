// ── Database types (mirrors Supabase schema) ──────────────────────────────────

export interface Company {
  id: string
  name: string
  created_at: string
}

export interface CompanyUser {
  id: string
  company_id: string
  user_id: string
  email: string
  role: 'admin' | 'employee'
  created_at: string
}

export interface DbClient {
  id: string
  company_id: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  created_at: string
  updated_at: string
}

export interface DbQuote {
  id: string
  company_id: string
  client_id: string | null
  client_name: string
  items: any[]
  subtotal: number
  iva: number | null
  discount: number | null
  total: number
  status: string
  notes: string
  created_at: string
  updated_at: string
}

export interface DbInvoice {
  id: string
  company_id: string
  number: string
  quote_id: string | null
  client_id: string | null
  client_name: string
  items: any[]
  subtotal: number
  iva: number | null
  discount: number | null
  total: number
  status: string
  notes: string
  issued_at: string | null
  paid_at: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface DbProduct {
  id: string
  company_id: string
  name: string
  category: string
  unit: string
  stock: number
  min_stock: number
  unit_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DbStockMovement {
  id: string
  company_id: string
  product_id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string | null
  created_at: string
}

export interface DbAppointment {
  id: string
  company_id: string
  title: string
  client_name: string
  client_id: string | null
  quote_id: string | null
  date: string
  time: string | null
  duration_minutes: number | null
  notes: string | null
  address: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface DbSettings {
  id: string
  company_id: string
  mp_alias: string
  business_name: string
  created_at: string
  updated_at: string
}
