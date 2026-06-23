import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '../shared/components/Card'
import { AppointmentForm } from '../features/scheduling/components/AppointmentForm'
import { useAppointmentStore } from '../features/scheduling/store'

export function AgendaFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = id
      ? 'Editar turno | ElectroGestor'
      : 'Nuevo turno | ElectroGestor'
  }, [id])

  const appointment = useAppointmentStore((s) =>
    id ? s.getAppointmentById(id) : undefined,
  )

  // If editing and appointment not found, show error
  if (id && !appointment) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Turno no encontrado</p>
            <button
              onClick={() => navigate('/agenda')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Volver a la agenda
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {id ? 'Editar turno' : 'Nuevo turno'}
          </h2>
        </CardHeader>
        <AppointmentForm
          editAppointment={appointment}
          onSuccess={() => navigate('/agenda')}
          onCancel={() => navigate('/agenda')}
        />
      </Card>
    </div>
  )
}
