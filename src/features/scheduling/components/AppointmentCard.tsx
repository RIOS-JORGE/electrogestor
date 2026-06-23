import { useState } from 'react'
import type { Appointment } from '../types'
import {
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_BORDER_COLORS,
} from '../types'
import { useAppointmentStore } from '../store'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { Modal } from '../../../shared/components/Modal'

interface AppointmentCardProps {
  appointment: Appointment
  onClick?: (appointment: Appointment) => void
  onEdit?: (appointment: Appointment) => void
}

export function AppointmentCard({ appointment, onClick, onEdit }: AppointmentCardProps) {
  const updateAppointmentStatus = useAppointmentStore((s) => s.updateAppointmentStatus)
  const deleteAppointment = useAppointmentStore((s) => s.deleteAppointment)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const isScheduled = appointment.status === 'scheduled'
  const isInProgress = appointment.status === 'in_progress'
  const timeDisplay = appointment.time
    ? appointment.time
    : appointment.duration
      ? `${appointment.duration} min`
      : null

  function handleStatusTransition(status: Appointment['status']) {
    updateAppointmentStatus(appointment.id, status)
  }

  function handleConfirmDelete() {
    deleteAppointment(appointment.id)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div
        className={`cursor-pointer border-l-4 ${STATUS_BORDER_COLORS[appointment.status]} rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md`}
        onClick={() => onClick?.(appointment)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onClick?.(appointment)
        }}
      >
        <div className="p-4">
          {/* Header: title + status badge */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {appointment.title}
            </h3>
            <Badge variant={STATUS_BADGE_VARIANTS[appointment.status]}>
              {STATUS_LABELS[appointment.status]}
            </Badge>
          </div>

          {/* Client name */}
          <p className="mb-1 text-sm text-gray-600">
            <span className="font-medium">Cliente:</span> {appointment.clientName}
          </p>

          {/* Date and time */}
          <div className="mb-3 flex items-center gap-3 text-sm text-gray-500">
            <span>{appointment.date}</span>
            {timeDisplay && (
              <>
                <span aria-hidden="true">·</span>
                <span>{timeDisplay}</span>
              </>
            )}
            {appointment.duration && appointment.time && (
              <>
                <span aria-hidden="true">·</span>
                <span>{appointment.duration} min</span>
              </>
            )}
          </div>

          {/* Quick actions (only if not terminal) */}
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {isScheduled && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusTransition('in_progress')}
                >
                  Iniciar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleStatusTransition('cancelled')}
                >
                  Cancelar
                </Button>
              </>
            )}

            {isInProgress && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleStatusTransition('completed')}
                >
                  Completar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleStatusTransition('cancelled')}
                >
                  Cancelar
                </Button>
              </>
            )}

            {/* Edit button (always visible) */}
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(appointment)}
              >
                Editar
              </Button>
            )}

            {/* Delete button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteModal(true)}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar turno"
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-600">
          ¿Estás seguro de que querés eliminar el turno <strong>{appointment.title}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirmDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </>
  )
}
