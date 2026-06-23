import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../shared/components/Card'
import { Badge } from '../shared/components/Badge'
import { Button } from '../shared/components/Button'
import { Modal } from '../shared/components/Modal'
import { useAppointmentStore } from '../features/scheduling/store'
import {
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
} from '../features/scheduling/types'

export function AgendaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const appointment = useAppointmentStore((s) =>
    id ? s.getAppointmentById(id) : undefined,
  )
  const deleteAppointment = useAppointmentStore((s) => s.deleteAppointment)
  const updateAppointmentStatus = useAppointmentStore(
    (s) => s.updateAppointmentStatus,
  )

  useEffect(() => {
    if (appointment) {
      document.title = `${appointment.title} | ElectroGestor`
    }
  }, [appointment])

  if (!appointment) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500">Turno no encontrado</p>
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

  const appointmentId = appointment.id
  const isScheduled = appointment.status === 'scheduled'
  const isInProgress = appointment.status === 'in_progress'

  function handleDelete() {
    deleteAppointment(appointmentId)
    setShowDeleteModal(false)
    navigate('/agenda')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header with back + edit */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/agenda')}
          className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>
        <Link to={`/agenda/${appointment.id}/editar`}>
          <Button size="sm" variant="outline">
            Editar
          </Button>
        </Link>
      </div>

      {/* Detail card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {appointment.title}
            </h2>
            <Badge variant={STATUS_BADGE_VARIANTS[appointment.status]}>
              {STATUS_LABELS[appointment.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Client */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Cliente
            </p>
            <p className="mt-1 text-sm text-gray-900">
              {appointment.clientId ? (
                <Link
                  to={`/clientes/${appointment.clientId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {appointment.clientName}
                </Link>
              ) : (
                appointment.clientName
              )}
            </p>
          </div>

          {/* Date, time, duration */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Fecha
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.date}
              </p>
            </div>
            {appointment.time && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Hora
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {appointment.time}
                </p>
              </div>
            )}
            {appointment.duration && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Duración
                </p>
                <p className="mt-1 text-sm text-gray-900">
                  {appointment.duration} min
                </p>
              </div>
            )}
          </div>

          {/* Address */}
          {appointment.address && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Dirección
              </p>
              <p className="mt-1 text-sm text-gray-900">
                {appointment.address}
              </p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Notas
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                {appointment.notes}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Status actions */}
      <Card>
        <CardBody>
          <p className="mb-3 text-sm font-medium text-gray-700">Acciones</p>
          <div className="flex flex-wrap gap-2">
            {isScheduled && (
              <>
                <Button
                  onClick={() =>
                    updateAppointmentStatus(appointment.id, 'in_progress')
                  }
                >
                  Iniciar turno
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    updateAppointmentStatus(appointment.id, 'cancelled')
                  }
                >
                  Cancelar turno
                </Button>
              </>
            )}
            {isInProgress && (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    updateAppointmentStatus(appointment.id, 'completed')
                  }
                >
                  Marcar como completado
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    updateAppointmentStatus(appointment.id, 'cancelled')
                  }
                >
                  Cancelar turno
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
            >
              Eliminar turno
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar turno"
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          ¿Estás seguro de que querés eliminar el turno{' '}
          <strong>{appointment.title}</strong>? Esta acción no se puede
          deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
