import { create } from 'zustand'
import type { Appointment, AppointmentStatus } from './types'
import { getCompanyId } from '../../lib/supabase'
import {
  getAllAppointments,
  createAppointment as apiCreateAppointment,
  updateAppointment as apiUpdateAppointment,
  deleteAppointment as apiDeleteAppointment,
  updateAppointmentStatus as apiUpdateAppointmentStatus,
} from './api'
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
  loaded: boolean
  loadAll: () => Promise<void>
  addAppointment: (appointment: Appointment) => Promise<void>
  updateAppointment: (id: string, data: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  getAppointmentById: (id: string) => Appointment | undefined
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>
  getAppointmentsByDate: (date: string) => Appointment[]
  getTodayAppointments: () => Appointment[]
  getUpcomingAppointments: () => Appointment[]
}

// ── Store implementation ─────────────────────────────────────────────────────

export const useAppointmentStore = create<AppointmentStore>()((set, get) => ({
  appointments: [],
  loaded: false,

  loadAll: async () => {
    try {
      const companyId = getCompanyId()
      const result = await getAllAppointments(companyId)
      if (result.data) {
        set({ appointments: result.data, loaded: true })
      } else {
        console.error('Error al cargar turnos:', result.error)
      }
    } catch (err) {
      console.error('Error al cargar turnos:', err)
    }
  },

  addAppointment: async (appointment) => {
    const companyId = getCompanyId()
    const result = await apiCreateAppointment(appointment, companyId)
    if (result.data) {
      set((state) => ({
        appointments: [...state.appointments, result.data!],
      }))
    } else {
      useToastStore.getState().addToast('Error al guardar turno', 'error')
      throw new Error(result.error ?? 'Error al guardar turno')
    }
  },

  updateAppointment: async (id, data) => {
    const companyId = getCompanyId()
    const result = await apiUpdateAppointment(id, data, companyId)
    if (result.data) {
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === id ? result.data! : a,
        ),
      }))
    } else {
      useToastStore.getState().addToast('Error al actualizar turno', 'error')
      throw new Error(result.error ?? 'Error al actualizar turno')
    }
  },

  deleteAppointment: async (id) => {
    try {
      const companyId = getCompanyId()
      const result = await apiDeleteAppointment(id, companyId)
      if (!result.error) {
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id),
        }))
      } else {
        useToastStore.getState().addToast('Error al eliminar turno', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al eliminar turno', 'error')
    }
  },

  getAppointmentById: (id) => get().appointments.find((a) => a.id === id),

  updateAppointmentStatus: async (id, status) => {
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

    try {
      const companyId = getCompanyId()
      const result = await apiUpdateAppointmentStatus(id, companyId, status)
      if (result.data) {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? result.data! : a,
          ),
        }))
      } else {
        useToastStore.getState().addToast('Error al actualizar estado', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al actualizar estado', 'error')
    }
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
}))
