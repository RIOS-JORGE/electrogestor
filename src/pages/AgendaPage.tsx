import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../shared/components/Card'
import { Button } from '../shared/components/Button'
import { AppointmentList } from '../features/scheduling/components/AppointmentList'
import { CalendarView } from '../features/scheduling/components/CalendarView'

export function AgendaPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Agenda | ElectroGestor'
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Agenda</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === 'list' ? 'calendar' : 'list')}
          >
            {view === 'list' ? 'Ver calendario' : 'Ver lista'}
          </Button>
          <Link to="/agenda/nueva">
            <Button>Nuevo turno</Button>
          </Link>
        </div>
      </div>

      <Card padding="lg">
        {view === 'list' ? (
          <AppointmentList
            onCreateNew={() => navigate('/agenda/nueva')}
            onAppointmentClick={(appointment) =>
              navigate(`/agenda/${appointment.id}`)
            }
            onAppointmentEdit={(appointment) =>
              navigate(`/agenda/${appointment.id}/editar`)
            }
          />
        ) : (
          <CalendarView
            onDayClick={() => {
              setView('list')
            }}
          />
        )}
      </Card>
    </div>
  )
}
