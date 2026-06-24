import { useMemo, useState } from 'react'
import type { Appointment, AppointmentStatus } from '../types'
import { APPOINTMENT_STATUSES, STATUS_LABELS } from '../types'
import { useAppointmentStore } from '../store'
import { AppointmentCard } from './AppointmentCard'
import { Button } from '../../../shared/components/Button'

type StatusFilter = 'all' | AppointmentStatus

interface AppointmentListProps {
  onAppointmentClick?: (appointment: Appointment) => void
  onAppointmentEdit?: (appointment: Appointment) => void
  onCreateNew?: () => void
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  ...APPOINTMENT_STATUSES.map((s) => ({ value: s as StatusFilter, label: STATUS_LABELS[s] })),
]

function groupAppointments(
  appointments: Appointment[],
): { key: string; label: string; items: Appointment[] }[] {
  const today = todayISO()
  const todayItems: Appointment[] = []
  const upcomingItems: Appointment[] = []
  const pastItems: Appointment[] = []

  for (const a of appointments) {
    if (a.date === today) {
      todayItems.push(a)
    } else if (a.date > today) {
      upcomingItems.push(a)
    } else {
      pastItems.push(a)
    }
  }

  // Sort each group by date ascending, then by time
  const sortFn = (a: Appointment, b: Appointment) => {
    const dateCmp = a.date.localeCompare(b.date)
    if (dateCmp !== 0) return dateCmp
    if (a.time && b.time) return a.time.localeCompare(b.time)
    if (a.time) return -1
    if (b.time) return 1
    return 0
  }

  const sections: { key: string; label: string; items: Appointment[] }[] = []

  if (todayItems.length > 0) {
    sections.push({ key: 'today', label: 'Hoy', items: todayItems.sort(sortFn) })
  }
  if (upcomingItems.length > 0) {
    sections.push({ key: 'upcoming', label: 'Próximos', items: upcomingItems.sort(sortFn) })
  }
  if (pastItems.length > 0) {
    sections.push({ key: 'past', label: 'Anteriores', items: pastItems.sort(sortFn) })
  }

  return sections
}

export function AppointmentList({
  onAppointmentClick,
  onAppointmentEdit,
  onCreateNew,
}: AppointmentListProps) {
  const appointments = useAppointmentStore((s) => s.appointments)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return appointments
    return appointments.filter((a) => a.status === statusFilter)
  }, [appointments, statusFilter])

  const sections = useMemo(() => groupAppointments(filtered), [filtered])

  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <svg
            className="h-8 w-8 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          No hay turnos programados
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Programá tu primer turno para empezar a gestionar tu agenda.
        </p>
        {onCreateNew && (
          <Button className="mt-4" onClick={onCreateNew}>
            Programar turno
          </Button>
        )}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div>
        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay turnos con ese estado</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grouped sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.key}>
            <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">
              {section.label}
              <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
                ({section.items.length})
              </span>
            </h2>
            <div className="space-y-3">
              {section.items.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onClick={onAppointmentClick}
                  onEdit={onAppointmentEdit}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
