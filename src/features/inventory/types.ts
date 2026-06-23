import { z } from 'zod'

// ── Category ──────────────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS = ['cable', 'tablero', 'interruptor', 'herramienta', 'otro'] as const
export type ProductCategory = (typeof CATEGORY_OPTIONS)[number]

// ── Unit ──────────────────────────────────────────────────────────────────────

export const UNIT_OPTIONS = ['m', 'u', 'kg', 'rollo', 'paquete'] as const
export type ProductUnit = (typeof UNIT_OPTIONS)[number]

// ── Product ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  category: ProductCategory
  unit: ProductUnit
  stock: number
  minStock: number
  unitPrice?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

// ── Stock Movement ────────────────────────────────────────────────────────────

export const MOVEMENT_TYPES = ['in', 'out', 'adjustment'] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export interface StockMovement {
  id: string
  productId: string
  type: MovementType
  /** Signed delta applied to stock (positive = added, negative = removed) */
  quantity: number
  reason?: string
  createdAt: number
}

// ── Stock status ──────────────────────────────────────────────────────────────

export type StockStatus = 'normal' | 'low' | 'out'

export function getStockStatus(product: Pick<Product, 'stock' | 'minStock'>): StockStatus {
  if (product.stock === 0) return 'out'
  if (product.stock <= product.minStock) return 'low'
  return 'normal'
}

// ── Label helpers ─────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cable: 'Cable',
  tablero: 'Tablero',
  interruptor: 'Interruptor',
  herramienta: 'Herramienta',
  otro: 'Otro',
}

export const CATEGORY_OPTIONS_LABELED = CATEGORY_OPTIONS.map((c) => ({
  value: c,
  label: CATEGORY_LABELS[c],
}))

const UNIT_LABELS: Record<ProductUnit, string> = {
  m: 'Metros',
  u: 'Unidades',
  kg: 'Kilogramos',
  rollo: 'Rollo',
  paquete: 'Paquete',
}

export const UNIT_OPTIONS_LABELED = UNIT_OPTIONS.map((u) => ({
  value: u,
  label: UNIT_LABELS[u],
}))

// ── Form schema ───────────────────────────────────────────────────────────────

export const productFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  category: z.enum(CATEGORY_OPTIONS),
  unit: z.enum(UNIT_OPTIONS),
  stock: z.coerce.number().min(0, 'No puede ser negativo'),
  minStock: z.coerce.number().min(0, 'No puede ser negativo'),
  unitPrice: z.coerce.number().min(0, 'No puede ser negativo').optional(),
  notes: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productFormSchema>

// ── Full product schema for backup / store integrity ─────────────────────────

export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.enum(CATEGORY_OPTIONS),
  unit: z.enum(UNIT_OPTIONS),
  stock: z.number().min(0),
  minStock: z.number().min(0),
  unitPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

// ── Moveent schema for backup / store integrity ──────────────────────────────

export const stockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.number(),
  reason: z.string().optional(),
  createdAt: z.number(),
})
