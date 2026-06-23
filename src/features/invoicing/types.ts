import { z } from 'zod'
import { UNIT_OPTIONS } from '../quoting/types'
import type { QuoteItem } from '../quoting/types'

export const INVOICE_STATUSES = ['draft', 'issued', 'paid', 'cancelled'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export interface Invoice {
  id: string
  number: string
  quoteId?: string
  clientId?: string
  clientName: string
  items: QuoteItem[]
  subtotal: number
  iva?: number
  discount?: number
  total: number
  status: InvoiceStatus
  notes: string
  issuedAt?: number
  paidAt?: number
  dueDate?: number
  createdAt: number
  updatedAt: number
}

// ── Item form schemas (mirror quoting types but for invoicing forms) ──────────

const invoiceMaterialSchema = z.object({
  id: z.string(),
  type: z.literal('material'),
  description: z.string().min(1, 'Descripción requerida').max(500),
  quantity: z.coerce.number().positive('Debe ser mayor a 0'),
  unit: z.enum(UNIT_OPTIONS),
  unitPrice: z.coerce.number().nonnegative('Debe ser 0 o mayor'),
})

const invoiceLaborSchema = z.object({
  id: z.string(),
  type: z.literal('labor'),
  description: z.string().min(1, 'Descripción requerida').max(500),
  laborHours: z.coerce.number().positive('Debe ser mayor a 0'),
  hourlyRate: z.coerce.number().nonnegative('Debe ser 0 o mayor'),
})

const invoiceItemSchema = z.union([invoiceMaterialSchema, invoiceLaborSchema])

// ── Form schema for creating/editing invoices ────────────────────────────────

export const invoiceFormSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1, 'El cliente es obligatorio'),
  items: z
    .array(invoiceItemSchema)
    .min(1, 'Agregá al menos un item'),
  includeIVA: z.boolean().default(true),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  dueDate: z.coerce.number().optional(),
  notes: z.string().optional().default(''),
})

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>

// ── Full invoice schema for backup / store integrity validation ──────────────

export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  quoteId: z.string().optional(),
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  items: z.array(invoiceItemSchema),
  subtotal: z.coerce.number().nonnegative(),
  iva: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative(),
  status: z.enum(INVOICE_STATUSES),
  notes: z.string(),
  issuedAt: z.coerce.number().optional(),
  paidAt: z.coerce.number().optional(),
  dueDate: z.coerce.number().optional(),
  createdAt: z.coerce.number(),
  updatedAt: z.coerce.number(),
})
