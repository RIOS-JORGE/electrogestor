import { z } from 'zod'

export const UNIT_OPTIONS = ['m', 'u', 'kg', 'h'] as const
export type Unit = (typeof UNIT_OPTIONS)[number]

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

export interface MaterialItem {
  id: string
  type: 'material'
  description: string
  quantity: number
  unit: Unit
  unitPrice: number
}

export interface LaborItem {
  id: string
  type: 'labor'
  description: string
  laborHours: number
  hourlyRate: number
}

export type QuoteItem = MaterialItem | LaborItem

export interface Quote {
  id: string
  clientId?: string
  clientName: string
  items: QuoteItem[]
  subtotal: number
  iva?: number
  discount?: number
  total: number
  status: QuoteStatus
  notes: string
  createdAt: number
  updatedAt: number
}

const materialFormSchema = z.object({
  id: z.string(),
  type: z.literal('material'),
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.coerce.number().positive('Debe ser mayor a 0'),
  unit: z.enum(UNIT_OPTIONS),
  unitPrice: z.coerce.number().nonnegative('Debe ser 0 o mayor'),
})

const laborFormSchema = z.object({
  id: z.string(),
  type: z.literal('labor'),
  description: z.string().min(1, 'Descripción requerida').max(500),
  laborHours: z.coerce.number().positive('Debe ser mayor a 0'),
  hourlyRate: z.coerce.number().nonnegative('Debe ser 0 o mayor'),
})

export const quoteFormSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1, 'El cliente es obligatorio'),
  items: z
    .array(z.union([materialFormSchema, laborFormSchema]))
    .min(1, 'Agregá al menos un item'),
  includeIVA: z.boolean().default(true),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional().default(''),
})

export type QuoteFormData = z.infer<typeof quoteFormSchema>
