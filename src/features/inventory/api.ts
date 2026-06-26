import { supabase } from '../../lib/supabase'
import type { ApiResult, DbProduct, DbStockMovement } from '../../lib/types'
import type { Product, StockMovement, MovementType } from './types'

// ── Mappers ─────────────────────────────────────────────────────────────────

function mapDbToProduct(db: DbProduct): Product {
  const VALID_CATEGORIES = ['cable', 'tablero', 'interruptor', 'herramienta', 'otro'] as const
  const VALID_UNITS = ['m', 'u', 'kg', 'rollo', 'paquete'] as const
  if (!VALID_CATEGORIES.includes(db.category as any)) {
    console.warn(`Unexpected product category: ${db.category}`)
  }
  if (!VALID_UNITS.includes(db.unit as any)) {
    console.warn(`Unexpected product unit: ${db.unit}`)
  }
  return {
    id: db.id,
    name: db.name,
    category: db.category as Product['category'],
    unit: db.unit as Product['unit'],
    stock: Number(db.stock),
    minStock: Number(db.min_stock),
    unitPrice: db.unit_price != null ? Number(db.unit_price) : undefined,
    notes: db.notes ?? undefined,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  }
}

function mapDbToMovement(db: DbStockMovement): StockMovement {
  const VALID_MOVEMENT_TYPES = ['in', 'out', 'adjustment'] as const
  if (!VALID_MOVEMENT_TYPES.includes(db.type as any)) {
    console.warn(`Unexpected movement type: ${db.type}`)
  }
  return {
    id: db.id,
    productId: db.product_id,
    type: db.type as MovementType,
    quantity: Number(db.quantity),
    reason: db.reason ?? undefined,
    createdAt: new Date(db.created_at).getTime(),
  }
}

// ── Product CRUD ────────────────────────────────────────────────────────────

export async function getAllProducts(
  companyId: string,
): Promise<ApiResult<Product[]>> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', companyId)
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToProduct), error: null }
}

export async function getProductById(
  id: string,
  companyId: string,
): Promise<ApiResult<Product>> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToProduct(data), error: null }
}

export async function createProduct(
  product: Product,
  companyId: string,
): Promise<ApiResult<Product>> {
  const dbRow = {
    id: product.id,
    company_id: companyId,
    name: product.name,
    category: product.category,
    unit: product.unit,
    stock: product.stock,
    min_stock: product.minStock,
    unit_price: product.unitPrice ?? null,
    notes: product.notes ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('products')
    .insert(dbRow)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToProduct(data), error: null }
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>,
  companyId: string,
): Promise<ApiResult<Product>> {
  const dbUpdate: Record<string, unknown> = {}
  if (data.name !== undefined) dbUpdate.name = data.name
  if (data.category !== undefined) dbUpdate.category = data.category
  if (data.unit !== undefined) dbUpdate.unit = data.unit
  if (data.stock !== undefined) dbUpdate.stock = data.stock
  if (data.minStock !== undefined) dbUpdate.min_stock = data.minStock
  if (data.unitPrice !== undefined) dbUpdate.unit_price = data.unitPrice ?? null
  if (data.notes !== undefined) dbUpdate.notes = data.notes ?? null
  dbUpdate.updated_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('products')
    .update(dbUpdate)
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToProduct(result), error: null }
}

export async function deleteProduct(
  id: string,
  companyId: string,
): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}

// ── Stock adjustment ────────────────────────────────────────────────────────

/**
 * Updates the product's stock value in the database.
 * The caller (store) is responsible for computing the new stock value
 * and validating business rules (non-negative, etc.).
 */
export async function adjustStock(
  productId: string,
  companyId: string,
  newStock: number,
): Promise<ApiResult<Product>> {
  const { data, error } = await supabase
    .from('products')
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', productId)
    .eq('company_id', companyId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToProduct(data), error: null }
}

// ── Stock movements ─────────────────────────────────────────────────────────

export async function getAllMovements(
  companyId: string,
): Promise<ApiResult<StockMovement[]>> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToMovement), error: null }
}

export async function getMovementsByProduct(
  productId: string,
  companyId: string,
): Promise<ApiResult<StockMovement[]>> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data: data.map(mapDbToMovement), error: null }
}

export async function createMovement(
  movement: StockMovement,
  companyId: string,
): Promise<ApiResult<StockMovement>> {
  const dbRow = {
    id: movement.id,
    company_id: companyId,
    product_id: movement.productId,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason ?? null,
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('stock_movements')
    .insert(dbRow)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: mapDbToMovement(data), error: null }
}

export async function deleteMovement(
  id: string,
  companyId: string,
): Promise<ApiResult<void>> {
  const { error } = await supabase
    .from('stock_movements')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)

  if (error) return { data: null, error: error.message }
  return { data: undefined, error: null }
}
