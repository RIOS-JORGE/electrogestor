import { z } from 'zod'

export const settingsSchema = z.object({
  mpAlias: z.string().max(100).optional().default(''),
  businessName: z.string().max(200).optional().default(''),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
})

export type Settings = z.infer<typeof settingsSchema>
