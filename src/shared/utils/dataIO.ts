import { z } from 'zod'
import type { Client } from '../../features/clients/types'
import type { Quote } from '../../features/quoting/types'
import { useClientStore } from '../../features/clients/store'
import { useQuoteStore } from '../../features/quoting/store'

/* ------------------------------------------------------------------ */
/*  Schemas for backup validation (full objects, not form-only)       */
/* ------------------------------------------------------------------ */

const clientBackupSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  phone: z.string().max(50),
  email: z.string().max(200),
  address: z.string().max(500),
  notes: z.string().max(2000),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const materialItemSchema = z.object({
  id: z.string(),
  type: z.literal('material'),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unit: z.enum(['m', 'u', 'kg', 'h']),
  unitPrice: z.number().nonnegative(),
})

const laborItemSchema = z.object({
  id: z.string(),
  type: z.literal('labor'),
  description: z.string().min(1).max(500),
  laborHours: z.number().positive(),
  hourlyRate: z.number().nonnegative(),
})

const quoteItemSchema = z.union([materialItemSchema, laborItemSchema])

const quoteBackupSchema = z.object({
  id: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().min(1).max(500),
  items: z.array(quoteItemSchema),
  subtotal: z.number().nonnegative(),
  iva: z.number().nonnegative().optional(),
  discount: z.number().nonnegative().optional(),
  total: z.number().nonnegative(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
  notes: z.string().max(5000),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const backupFileSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  clients: z.array(clientBackupSchema),
  quotes: z.array(quoteBackupSchema),
})

export type BackupData = z.infer<typeof backupFileSchema>

/* ------------------------------------------------------------------ */
/*  Export                                                             */
/* ------------------------------------------------------------------ */

/** Reads both stores, creates a JSON blob, and triggers a download. */
export function exportData(): void {
  const clients = useClientStore.getState().clients
  const quotes = useQuoteStore.getState().quotes

  const data: BackupData = {
    version: 1,
    exportedAt: Date.now(),
    clients,
    quotes,
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `electrogestor-backup-${dateStr}.json`

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/*  Import                                                             */
/* ------------------------------------------------------------------ */

export interface ImportResult {
  success: boolean
  clientsCount: number
  quotesCount: number
  errors: string[]
}

/** Reads a File, validates the structure, and replaces store data. */
export async function importData(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    clientsCount: 0,
    quotesCount: 0,
    errors: [],
  }

  let raw: unknown
  try {
    const text = await file.text()
    raw = JSON.parse(text)
  } catch {
    result.errors.push('El archivo no contiene JSON válido.')
    return result
  }

  const parsed = backupFileSchema.safeParse(raw)
  if (!parsed.success) {
    result.errors.push(
      'El archivo no tiene el formato de respaldo de ElectroGestor. ' +
        parsed.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
    )
    return result
  }

  const { clients, quotes } = parsed.data

  /* Merge clients: update existing, add new */
  const existingClients = useClientStore.getState().clients
  const mergedClients = [...existingClients]
  let addedClients = 0

  for (const imported of clients as Client[]) {
    const idx = mergedClients.findIndex((c) => c.id === imported.id)
    if (idx >= 0) {
      mergedClients[idx] = { ...mergedClients[idx], ...imported, updatedAt: Date.now() }
    } else {
      mergedClients.push(imported)
      addedClients++
    }
  }
  useClientStore.setState({ clients: mergedClients })

  /* Merge quotes: update existing, add new */
  const existingQuotes = useQuoteStore.getState().quotes
  const mergedQuotes = [...existingQuotes]
  let addedQuotes = 0

  for (const imported of quotes as Quote[]) {
    const idx = existingQuotes.findIndex((q) => q.id === imported.id)
    if (idx >= 0) {
      mergedQuotes[idx] = { ...mergedQuotes[idx], ...imported, updatedAt: Date.now() }
    } else {
      mergedQuotes.push(imported)
      addedQuotes++
    }
  }
  useQuoteStore.setState({ quotes: mergedQuotes })

  result.success = true
  result.clientsCount = addedClients
  result.quotesCount = addedQuotes

  return result
}
