import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsStore } from './store'

vi.mock('./api', () => ({
  getSettings: vi.fn(),
  upsertSettings: vi.fn(),
}))

import * as api from './api'
import { setCompanyId } from '../../lib/supabase'

beforeEach(() => {
  setCompanyId('test-company')
  useSettingsStore.setState({ mpAlias: '', businessName: '', loaded: false })
  vi.clearAllMocks()
})

describe('SettingsStore', () => {
  it('has default values as empty strings and loaded=false', () => {
    const state = useSettingsStore.getState()
    expect(state.mpAlias).toBe('')
    expect(state.businessName).toBe('')
    expect(state.loaded).toBe(false)
  })

  describe('loadAll', () => {
    it('sets settings and loaded=true on success', async () => {
      const settings = { mpAlias: 'electro.mp', businessName: 'Mi Negocio', createdAt: Date.now(), updatedAt: Date.now() }
      vi.mocked(api.getSettings).mockResolvedValue({ data: settings, error: null })

      await useSettingsStore.getState().loadAll()

      expect(useSettingsStore.getState().mpAlias).toBe('electro.mp')
      expect(useSettingsStore.getState().businessName).toBe('Mi Negocio')
      expect(useSettingsStore.getState().loaded).toBe(true)
    })

    it('handles null data (fresh company) by marking loaded', async () => {
      vi.mocked(api.getSettings).mockResolvedValue({ data: null, error: null })

      await useSettingsStore.getState().loadAll()

      expect(useSettingsStore.getState().mpAlias).toBe('')
      expect(useSettingsStore.getState().businessName).toBe('')
      expect(useSettingsStore.getState().loaded).toBe(true)
    })

    it('still marks loaded on error', async () => {
      vi.mocked(api.getSettings).mockResolvedValue({ data: null, error: 'Network error' })

      await useSettingsStore.getState().loadAll()

      expect(useSettingsStore.getState().loaded).toBe(true)
      expect(useSettingsStore.getState().mpAlias).toBe('')
    })
  })

  describe('updateSettings', () => {
    it('sets mpAlias on success', async () => {
      vi.mocked(api.upsertSettings).mockResolvedValue({
        data: { mpAlias: 'electro.mp', businessName: '', createdAt: Date.now(), updatedAt: Date.now() },
        error: null,
      })

      await useSettingsStore.getState().updateSettings({ mpAlias: 'electro.mp' })

      expect(useSettingsStore.getState().mpAlias).toBe('electro.mp')
    })

    it('sets businessName on success', async () => {
      vi.mocked(api.upsertSettings).mockResolvedValue({
        data: { mpAlias: '', businessName: 'Mi Negocio', createdAt: Date.now(), updatedAt: Date.now() },
        error: null,
      })

      await useSettingsStore.getState().updateSettings({ businessName: 'Mi Negocio' })

      expect(useSettingsStore.getState().businessName).toBe('Mi Negocio')
    })

    it('merges multiple fields on success', async () => {
      vi.mocked(api.upsertSettings).mockResolvedValue({
        data: { mpAlias: 'test.mp', businessName: 'Test SA', createdAt: Date.now(), updatedAt: Date.now() },
        error: null,
      })

      await useSettingsStore.getState().updateSettings({ mpAlias: 'test.mp', businessName: 'Test SA' })

      const state = useSettingsStore.getState()
      expect(state.mpAlias).toBe('test.mp')
      expect(state.businessName).toBe('Test SA')
    })

    it('does not update on API error', async () => {
      vi.mocked(api.upsertSettings).mockResolvedValue({ data: null, error: 'DB error' })

      await useSettingsStore.getState().updateSettings({ mpAlias: 'should-not-set' })

      expect(useSettingsStore.getState().mpAlias).toBe('')
      expect(useSettingsStore.getState().businessName).toBe('')
    })
  })
})
