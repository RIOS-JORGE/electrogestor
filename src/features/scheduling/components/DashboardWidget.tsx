import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../../shared/components/Card'
import { Button } from '../../../shared/components/Button'
import { AppointmentCard } from './AppointmentCard'
import { useAppointmentStore } from '../store'

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function DashboardWidget() {
  const navigate = useNavigate()
  const appointments = useAppointmentStore((s) => s.appointments)

  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayISO()),
    [appointments],
  )
  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date > todayISO())
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3),
    [appointments],
  )

  const todayCount = todayAppointments.length

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Turnos hoy</p>
            <p className="text-3xl font-bold text-blue-600">{todayCount}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/agenda')}
          >
            Ver agenda
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Próximos turnos
            </p>
            {upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onClick={(a) => navigate(`/agenda/${a.id}`)}
                onEdit={(a) => navigate(`/agenda/${a.id}/editar`)}
              />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-400">
            No hay próximos turnos programados
          </p>
        )}
      </CardBody>
    </Card>
  )
}
