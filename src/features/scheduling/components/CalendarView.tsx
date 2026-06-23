import { useMemo, useState, useCallback } from 'react'
import { useAppointmentStore } from '../store'
import { Button } from '../../../shared/components/Button'

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface CalendarViewProps {
  onDayClick?: (date: string) => void
}

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7 // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Fill leading nulls
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill trailing nulls
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return weeks
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function CalendarView({ onDayClick }: CalendarViewProps) {
  const appointments = useAppointmentStore((s) => s.appointments)
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const weeks = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  // Build a map: date string → count
  const appointmentCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of appointments) {
      map.set(a.date, (map.get(a.date) ?? 0) + 1)
    }
    return map
  }, [appointments])

  const todayISO = useMemo(() => formatDate(today.getFullYear(), today.getMonth(), today.getDate()), [])

  const goToPrevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }, [])

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }, [])

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header: month/year + navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={goToToday}>
            Hoy
          </Button>
          <Button size="sm" variant="ghost" onClick={goToPrevMonth} aria-label="Mes anterior">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Button size="sm" variant="ghost" onClick={goToNextMonth} aria-label="Mes siguiente">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Day names header */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-semibold uppercase text-gray-500"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {weeks.flat().map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[72px]" />
          }

          const dateStr = formatDate(viewYear, viewMonth, day)
          const count = appointmentCountByDate.get(dateStr) ?? 0
          const isToday = dateStr === todayISO

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDayClick?.(dateStr)}
              className={`relative flex min-h-[72px] flex-col items-center justify-start p-1 text-sm transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 ${
                isToday ? 'bg-blue-50 font-semibold' : ''
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                  isToday ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}
              >
                {day}
              </span>
              {count > 0 && (
                <span className="mt-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-[11px] font-medium text-blue-700">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
