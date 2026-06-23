import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from './types'
import { settingsSchema } from './types'
import { useToastStore } from '../../shared/hooks/useToast'

interface SettingsStore {
  mpAlias: string
  businessName: string
  updateSettings: (partial: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      mpAlias: '',
      businessName: '',

      updateSettings: (partial) => {
        set((state) => ({ ...state, ...partial }))
      },
    }),
    {
      name: 'electrogestor-settings',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error al cargar configuración:', error)
          useToastStore.getState().addToast(
            'Error al cargar configuración guardada',
            'error',
          )
          return
        }

        if (!state) return

        const result = settingsSchema.safeParse(state)
        if (result.success) {
          state.mpAlias = result.data.mpAlias
          state.businessName = result.data.businessName
        } else {
          console.warn(
            'Configuración inválida en localStorage, usando valores por defecto',
          )
          state.mpAlias = ''
          state.businessName = ''
        }
      },
    },
  ),
)
