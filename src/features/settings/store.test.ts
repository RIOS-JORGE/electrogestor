import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useSettingsStore.setState({ mpAlias: '', businessName: '' })
})

describe('SettingsStore', () => {
  it('has default values as empty strings', () => {
    const state = useSettingsStore.getState()
    expect(state.mpAlias).toBe('')
    expect(state.businessName).toBe('')
  })

  it('updateSettings sets mpAlias', () => {
    useSettingsStore.getState().updateSettings({ mpAlias: 'electro.mp' })
    expect(useSettingsStore.getState().mpAlias).toBe('electro.mp')
  })

  it('updateSettings sets businessName', () => {
    useSettingsStore.getState().updateSettings({ businessName: 'Mi Negocio' })
    expect(useSettingsStore.getState().businessName).toBe('Mi Negocio')
  })

  it('updateSettings merges multiple fields', () => {
    useSettingsStore.getState().updateSettings({
      mpAlias: 'test.mp',
      businessName: 'Test SA',
    })
    const state = useSettingsStore.getState()
    expect(state.mpAlias).toBe('test.mp')
    expect(state.businessName).toBe('Test SA')
  })

  it('presists with key electrogestor-settings', () => {
    const storageKey = 'electrogestor-settings'
    useSettingsStore.getState().updateSettings({ mpAlias: 'persist.mp' })

    const raw = localStorage.getItem(storageKey)
    expect(raw).not.toBeNull()

    if (raw) {
      const parsed = JSON.parse(raw)
      expect(parsed.state.mpAlias).toBe('persist.mp')
    }
  })
})
