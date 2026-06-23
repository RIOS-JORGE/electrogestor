import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAppointmentStore } from './store'
import type { Appointment } from './types'

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

beforeEach(() => {
  localStorage.clear()
  useAppointmentStore.setState({ appointments: [] })
})

describe('AppointmentStore', () => {
  describe('CRUD', () => {
    it('adds an appointment', () => {
      const apt = createAppointment()
      useAppointmentStore.getState().addAppointment(apt)

      expect(useAppointmentStore.getState().appointments).toHaveLength(1)
      expect(useAppointmentStore.getState().appointments[0].title).toBe(
        'Instalación eléctrica',
      )
    })

    it('updates an appointment', () => {
      const apt = createAppointment()
      useAppointmentStore.getState().addAppointment(apt)
      useAppointmentStore.getState().updateAppointment(apt.id, {
        title: 'Reparación',
      })

      const updated = useAppointmentStore.getState().getAppointmentById(apt.id)
      expect(updated?.title).toBe('Reparación')
      expect(updated?.updatedAt).toBeGreaterThanOrEqual(apt.createdAt)
    })

    it('deletes an appointment', () => {
      const apt = createAppointment()
      useAppointmentStore.getState().addAppointment(apt)
      useAppointmentStore.getState().deleteAppointment(apt.id)

      expect(useAppointmentStore.getState().appointments).toHaveLength(0)
    })
  })

  describe('state machine', () => {
    it('allows scheduled → in_progress', () => {
      const apt = createAppointment()
      useAppointmentStore.getState().addAppointment(apt)
      useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'in_progress')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe(
        'in_progress',
      )
    })

    it('allows in_progress → completed', () => {
      const apt = createAppointment({ status: 'in_progress' })
      useAppointmentStore.getState().addAppointment(apt)
      useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'completed')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe(
        'completed',
      )
    })

    it('allows scheduled → cancelled', () => {
      const apt = createAppointment()
      useAppointmentStore.getState().addAppointment(apt)
      useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'cancelled')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe(
        'cancelled',
      )
    })

    it('prevents scheduled → completed (invalid transition)', () => {
      const apt = createAppointment()
      useAppointmentStore.getState().addAppointment(apt)
      useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'completed')

      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe(
        'scheduled',
      )
    })

    it('prevents completed → any transition', () => {
      const apt = createAppointment({ status: 'completed' })
      useAppointmentStore.getState().addAppointment(apt)

      useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'scheduled')
      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe(
        'completed',
      )

      useAppointmentStore.getState().updateAppointmentStatus(apt.id, 'cancelled')
      expect(useAppointmentStore.getState().getAppointmentById(apt.id)?.status).toBe(
        'completed',
      )
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

    it('getTodayAppointments returns appointments for today', () => {
      const today = createAppointment({ date: '2026-06-23' })
      const other = createAppointment({
        id: 'apt-2',
        title: 'Otro',
        date: '2026-06-24',
      })
      useAppointmentStore.getState().addAppointment(today)
      useAppointmentStore.getState().addAppointment(other)

      const result = useAppointmentStore.getState().getTodayAppointments()
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('apt-1')
    })

    it('getUpcomingAppointments returns future appointments sorted by date', () => {
      const past = createAppointment({ id: 'apt-past', date: '2026-06-22' })
      const future1 = createAppointment({
        id: 'apt-future-1',
        date: '2026-06-25',
        title: 'Z',
      })
      const future2 = createAppointment({
        id: 'apt-future-2',
        date: '2026-06-24',
        title: 'A',
      })
      useAppointmentStore.getState().addAppointment(past)
      useAppointmentStore.getState().addAppointment(future1)
      useAppointmentStore.getState().addAppointment(future2)

      const upcoming = useAppointmentStore.getState().getUpcomingAppointments()
      expect(upcoming).toHaveLength(2)
      // Sorted by date ascending
      expect(upcoming[0].id).toBe('apt-future-2') // 2026-06-24
      expect(upcoming[1].id).toBe('apt-future-1') // 2026-06-25
    })

    it('getUpcomingAppointments excludes past and today appointments', () => {
      const today = createAppointment({ date: '2026-06-23' })
      const past = createAppointment({
        id: 'apt-past',
        date: '2026-06-22',
      })
      const future = createAppointment({
        id: 'apt-future',
        date: '2026-06-24',
      })
      useAppointmentStore.getState().addAppointment(today)
      useAppointmentStore.getState().addAppointment(past)
      useAppointmentStore.getState().addAppointment(future)

      const upcoming = useAppointmentStore.getState().getUpcomingAppointments()
      expect(upcoming).toHaveLength(1)
      expect(upcoming[0].id).toBe('apt-future')
    })

    it('getAppointmentsByDate filters by date', () => {
      const apt1 = createAppointment({ date: '2026-06-23' })
      const apt2 = createAppointment({
        id: 'apt-2',
        date: '2026-06-24',
      })
      useAppointmentStore.getState().addAppointment(apt1)
      useAppointmentStore.getState().addAppointment(apt2)

      expect(useAppointmentStore.getState().getAppointmentsByDate('2026-06-23')).toHaveLength(1)
      expect(useAppointmentStore.getState().getAppointmentsByDate('2026-06-24')).toHaveLength(1)
      expect(useAppointmentStore.getState().getAppointmentsByDate('2026-06-25')).toHaveLength(0)
    })
  })
})
