import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Appointment, AppointmentStatus } from './types'
import { useToastStore } from '../../shared/hooks/useToast'

// ── State machine: which transitions are allowed ─────────────────────────────

const VALID_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

// ── ISO date helpers ─────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Store interface ──────────────────────────────────────────────────────────

interface AppointmentStore {
  appointments: Appointment[]
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, data: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => void
  deleteAppointment: (id: string) => void
  getAppointmentById: (id: string) => Appointment | undefined
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void
  getAppointmentsByDate: (date: string) => Appointment[]
  getTodayAppointments: () => Appointment[]
  getUpcomingAppointments: () => Appointment[]
}

// ── Store implementation ─────────────────────────────────────────────────────

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set, get) => ({
      appointments: [],

      addAppointment: (appointment) =>
        set((state) => ({
          appointments: [...state.appointments, appointment],
        })),

      updateAppointment: (id, data) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a,
          ),
        })),

      deleteAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        })),

      getAppointmentById: (id) => get().appointments.find((a) => a.id === id),

      updateAppointmentStatus: (id, status) => {
        const appointment = get().appointments.find((a) => a.id === id)
        if (!appointment) return

        const allowed = VALID_TRANSITIONS[appointment.status]
        if (!allowed.includes(status)) {
          useToastStore.getState().addToast(
            `No se puede cambiar el estado de "${appointment.title}"`,
            'error',
          )
          return
        }

        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status, updatedAt: Date.now() } : a,
          ),
        }))
      },

      getAppointmentsByDate: (date) =>
        get().appointments.filter((a) => a.date === date),

      getTodayAppointments: () =>
        get().appointments.filter((a) => a.date === todayISO()),

      getUpcomingAppointments: () => {
        const today = todayISO()
        return get()
          .appointments
          .filter((a) => a.date > today)
          .sort((a, b) => a.date.localeCompare(b.date))
      },
    }),
    {
      name: 'electrogestor-appointments',
      onRehydrateStorage: () => (_, error) => {
        if (error) {
          console.error('Error al cargar datos de turnos:', error)
          useToastStore.getState().addToast(
            'Error al cargar datos de turnos guardados',
            'error',
          )
        }
      },
    },
  ),
)
