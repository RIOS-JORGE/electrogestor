import { z } from 'zod'

export const APPOINTMENT_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

export interface Appointment {
  id: string
  title: string
  clientId?: string
  clientName: string
  quoteId?: string
  date: string // ISO date YYYY-MM-DD
  time?: string // HH:MM
  duration?: number // minutes
  notes?: string
  address?: string
  status: AppointmentStatus
  createdAt: number
  updatedAt: number
}

// ── Form schema ───────────────────────────────────────────────────────────────

export const appointmentFormSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  clientId: z.string().optional(),
  clientName: z.string().min(1, 'El cliente es obligatorio'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  time: z.string().optional(),
  duration: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentFormSchema>

// ── Full appointment schema for backup / store integrity validation ──────────

export const appointmentSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  quoteId: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
  duration: z.coerce.number().optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES),
  createdAt: z.coerce.number(),
  updatedAt: z.coerce.number(),
})

// ── Status display helpers ───────────────────────────────────────────────────

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Programado',
  in_progress: 'En progreso',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const STATUS_BADGE_VARIANTS: Record<AppointmentStatus, 'blue' | 'yellow' | 'green' | 'red'> = {
  scheduled: 'blue',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'red',
}

export const STATUS_BORDER_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'border-l-blue-500',
  in_progress: 'border-l-yellow-500',
  completed: 'border-l-green-500',
  cancelled: 'border-l-red-500',
}
