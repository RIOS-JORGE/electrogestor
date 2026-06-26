import { create } from 'zustand'
import type { Settings } from './types'
import { getCompanyId } from '../../lib/supabase'
import { getSettings, upsertSettings } from './api'
import { useToastStore } from '../../shared/hooks/useToast'

interface SettingsStore {
  mpAlias: string
  businessName: string
  loaded: boolean
  loadAll: () => Promise<void>
  updateSettings: (partial: Partial<Settings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
  mpAlias: '',
  businessName: '',
  loaded: false,

  loadAll: async () => {
    try {
      const companyId = getCompanyId()
      const result = await getSettings(companyId)
      if (result.data) {
        set({
          mpAlias: result.data.mpAlias ?? '',
          businessName: result.data.businessName ?? '',
          loaded: true,
        })
      } else {
        // No settings yet (fresh company) — not an error
        set({ loaded: true })
      }
    } catch (err) {
      console.error('Error al cargar configuración:', err)
      set({ loaded: true })
    }
  },

  updateSettings: async (partial) => {
    try {
      const companyId = getCompanyId()
      const result = await upsertSettings(companyId, partial)
      if (result.data) {
        set((state) => ({
          mpAlias: result.data!.mpAlias ?? state.mpAlias,
          businessName: result.data!.businessName ?? state.businessName,
        }))
      } else {
        useToastStore.getState().addToast('Error al guardar configuración', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al guardar configuración', 'error')
    }
  },
}))
