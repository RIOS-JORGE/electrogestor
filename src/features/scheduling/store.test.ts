import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAppointmentStore } from './store'
import type { Appointment } from './types'

vi.mock('./api', () => ({
  getAllAppointments: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  deleteAppointment: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}))

import * as api from './api'
import { setCompanyId } from '../../lib/supabase'

function createAppointment(overrides: Partial<Appointment> = {}): Appointment {
  const now = Date.now()
  return {
    id: 'apt-1',
    title: 'Instalación eléctrica',
    clientName: 'Juan Pérez',
    date: '2026-06-23',
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

async function addAppointmentToStore(apt: Appointment): Promise<void> {
  vi.mocked(api.createAppointment).mockResolvedValue({ data: apt, error: null })
  await useAppointmentStore.getState().addAppointment(apt)
}

beforeEach(() => {
  setCompanyId('test-company')
  useAppointmentStore.setState({ appointments: [], loaded: false })
  vi.clearAllMocks()
})

describe('AppointmentStore', () => {
  describe('loadAll', () => {
    it('sets appointments and loaded=true on success', async () => {
      const appointments = [createAppointment()]
      vi.mocked(api.getAllAppointments).mockResolvedValue({ data: appointments, error: null })

      await useAppointmentStore.getState().loadAll()

      expect(useAppointmentStore.getState().appointments).toEqual(appointments)
      expect(useAppointmentStore.getState().loaded).toBe(true)
    })

    it('does not set loaded on error', async () => {
      vi.mocked(api.getAllAppointments).mockResolvedValue({ data: null, error: 'Network error' })

      await useAppointmentStore.getState().loadAll()

      expect(useAppointmentStore.getState().loaded).toBe(false)
      expect(useAppointmentStore.getState().appointments).toEqual([])
    })
  })

  describe('CRUD', () => {
    it('adds an appointment on success', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      expect(useAppointmentStore.getState().appointments).toHaveLength(1)
      expect(useAppointmentStore.getState().appointments[0].title).toBe('Instalación eléctrica')
    })

    it('does not add on API error', async () => {
      const apt = createAppointment()
      vi.mocked(api.createAppointment).mockResolvedValue({ data: null, error: 'DB error' })

      await useAppointmentStore.getState().addAppointment(apt)

      expect(useAppointmentStore.getState().appointments).toHaveLength(0)
    })

    it('updates an appointment on success', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      const updated = { ...apt, title: 'Reparación', updatedAt: Date.now() + 1000 }
      vi.mocked(api.updateAppointment).mockResolvedValue({ data: updated, error: null })

      await useAppointmentStore.getState().updateAppointment(apt.id, { title: 'Reparación' })

      const result = useAppointmentStore.getState().getAppointmentById(apt.id)
      expect(result?.title).toBe('Reparación')
      expect(result?.updatedAt).toBeGreaterThan(apt.createdAt)
    })

    it('does not update on API error', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      vi.mocked(api.updateAppointment).mockResolvedValue({ data: null, error: 'DB error' })

      await useAppointmentStore.getState().updateAppointment(apt.id, { title: 'Reparación' })

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.title).toBe('Instalación eléctrica')
    })

    it('deletes an appointment on success', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      vi.mocked(api.deleteAppointment).mockResolvedValue({ data: undefined, error: null })

      await useAppointmentStore.getState().deleteAppointment(apt.id)

      expect(useAppointmentStore.getState().appointments).toHaveLength(0)
    })

    it('does not delete on API error', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      vi.mocked(api.deleteAppointment).mockResolvedValue({ data: null, error: 'DB error' })

      await useAppointmentStore.getState().deleteAppointment(apt.id)

      expect(useAppointmentStore.getState().appointments).toHaveLength(1)
    })
  })

  describe('state machine', () => {
    it('allows scheduled → in_progress', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      const updated = { ...apt, status: 'in_progress' as const }
      vi.mocked(api.updateAppointmentStatus).mockResolvedValue({ data: updated, error: null })

      await useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'in_progress')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe('in_progress')
    })

    it('allows in_progress → completed', async () => {
      const apt = createAppointment({ status: 'in_progress' })
      await addAppointmentToStore(apt)

      const updated = { ...apt, status: 'completed' as const }
      vi.mocked(api.updateAppointmentStatus).mockResolvedValue({ data: updated, error: null })

      await useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'completed')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe('completed')
    })

    it('allows scheduled → cancelled', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      const updated = { ...apt, status: 'cancelled' as const }
      vi.mocked(api.updateAppointmentStatus).mockResolvedValue({ data: updated, error: null })

      await useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'cancelled')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe('cancelled')
    })

    it('prevents scheduled → completed (invalid transition)', async () => {
      const apt = createAppointment()
      await addAppointmentToStore(apt)

      await useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'completed')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe('scheduled')
      expect(api.updateAppointmentStatus).not.toHaveBeenCalled()
    })

    it('prevents completed → any transition', async () => {
      const apt = createAppointment({ status: 'completed' })
      await addAppointmentToStore(apt)

      await useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'scheduled')
      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe('completed')

      await useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'cancelled')
      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe('completed')

      expect(api.updateAppointmentStatus).not.toHaveBeenCalled()
    })
  })

  describe('date queries', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-23T12:00:00'))
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    it('getTodayAppointments returns appointments for today', async () => {
      const today = createAppointment({ date: '2026-06-23' })
      const other = createAppointment({ id: 'apt-2', title: 'Otro', date: '2026-06-24' })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: today, error: null })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: other, error: null })

      await useAppointmentStore.getState().addAppointment(today)
      await useAppointmentStore.getState().addAppointment(other)

      const result = useAppointmentStore.getState().getTodayAppointments()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('apt-1')
    })

    it('getUpcomingAppointments returns future appointments sorted by date', async () => {
      const past = createAppointment({ id: 'apt-past', date: '2026-06-22' })
      const future1 = createAppointment({ id: 'apt-future-1', date: '2026-06-25', title: 'Z' })
      const future2 = createAppointment({ id: 'apt-future-2', date: '2026-06-24', title: 'A' })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: past, error: null })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: future1, error: null })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: future2, error: null })

      await useAppointmentStore.getState().addAppointment(past)
      await useAppointmentStore.getState().addAppointment(future1)
      await useAppointmentStore.getState().addAppointment(future2)

      const upcoming = useAppointmentStore.getState().getUpcomingAppointments()
      expect(upcoming).toHaveLength(2)
      // Sorted by date ascending
      expect(upcoming[0].id).toBe('apt-future-2') // 2026-06-24
      expect(upcoming[1].id).toBe('apt-future-1') // 2026-06-25
    })

    it('getUpcomingAppointments excludes past and today appointments', async () => {
      const today = createAppointment({ date: '2026-06-23' })
      const past = createAppointment({ id: 'apt-past', date: '2026-06-22' })
      const future = createAppointment({ id: 'apt-future', date: '2026-06-24' })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: today, error: null })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: past, error: null })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: future, error: null })

      await useAppointmentStore.getState().addAppointment(today)
      await useAppointmentStore.getState().addAppointment(past)
      await useAppointmentStore.getState().addAppointment(future)

      const upcoming = useAppointmentStore.getState().getUpcomingAppointments()
      expect(upcoming).toHaveLength(1)
      expect(upcoming[0].id).toBe('apt-future')
    })

    it('getAppointmentsByDate filters by date', async () => {
      const apt1 = createAppointment({ date: '2026-06-23' })
      const apt2 = createAppointment({ id: 'apt-2', date: '2026-06-24' })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: apt1, error: null })
      vi.mocked(api.createAppointment).mockResolvedValueOnce({ data: apt2, error: null })

      await useAppointmentStore.getState().addAppointment(apt1)
      await useAppointmentStore.getState().addAppointment(apt2)

      expect(useAppointmentStore.getState().getAppointmentsByDate('2026-06-23')).toHaveLength(1)
      expect(useAppointmentStore.getState().getAppointmentsByDate('2026-06-24')).toHaveLength(1)
      expect(useAppointmentStore.getState().getAppointmentsByDate('2026-06-25')).toHaveLength(0)
    })
  })
})
