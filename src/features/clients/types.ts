import { z } from 'zod'

export interface Client {
  id: string
  name: string
  phone: string
  email: string
  address: string
  notes: string
  createdAt: number
  updatedAt: number
}

export const clientFormSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  phone: z.string().max(50).optional().default(''),
  email: z
    .string()
    .email('Email inválido')
    .max(200)
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional().default(''),
  notes: z.string().max(2000).optional().default(''),
})

export type ClientFormData = z.infer<typeof clientFormSchema>
