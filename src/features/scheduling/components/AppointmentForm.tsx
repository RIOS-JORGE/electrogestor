import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentFormSchema, type Appointment, type AppointmentFormData } from '../types'
import { useAppointmentStore } from '../store'
import { useClientStore } from '../../clients/store'
import { ClientSelect } from '../../clients/components/ClientSelect'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { useIdGenerator } from '../../../shared/hooks/useIdGenerator'
import { useToast } from '../../../shared/hooks/useToast'

interface AppointmentFormProps {
  editAppointment?: Appointment
  onSuccess?: () => void
  onCancel?: () => void
}

export function AppointmentForm({ editAppointment, onSuccess, onCancel }: AppointmentFormProps) {
  const addAppointment = useAppointmentStore((s) => s.addAppointment)
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment)
  const clients = useClientStore((s) => s.clients)
  const generateId = useIdGenerator()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema) as any,
    defaultValues: editAppointment
      ? {
          title: editAppointment.title,
          clientId: editAppointment.clientId ?? '',
          clientName: editAppointment.clientName,
          date: editAppointment.date,
          time: editAppointment.time ?? '',
          duration: editAppointment.duration ?? undefined,
          notes: editAppointment.notes ?? '',
        }
      : {
          title: '',
          clientId: '',
          clientName: '',
          date: '',
          time: '',
          duration: undefined,
          notes: '',
        },
  })

  const selectedClientId = watch('clientId')

  // Auto-fill clientName when a client is selected from dropdown
  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find((c) => c.id === selectedClientId)
      if (client) {
        setValue('clientName', client.name)
      }
    }
  }, [selectedClientId, clients, setValue])

  const onSubmit: SubmitHandler<AppointmentFormData> = (data) => {
    if (editAppointment) {
      updateAppointment(editAppointment.id, {
        title: data.title,
        clientId: data.clientId || undefined,
        clientName: data.clientName,
        date: data.date,
        time: data.time || undefined,
        duration: data.duration || undefined,
        notes: data.notes || undefined,
      })
      addToast('Turno actualizado', 'success')
    } else {
      const now = Date.now()
      addAppointment({
        id: generateId(),
        title: data.title,
        clientId: data.clientId || undefined,
        clientName: data.clientName,
        date: data.date,
        time: data.time || undefined,
        duration: data.duration || undefined,
        notes: data.notes || undefined,
        status: 'scheduled',
        createdAt: now,
        updatedAt: now,
      })
      addToast('Turno creado', 'success')
    }
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Título *"
        placeholder="Ej: Instalación eléctrica"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ClientSelect
          error={errors.clientId?.message}
          registration={register('clientId')}
        />

        <Input
          label="Nombre del cliente *"
          placeholder="Nombre o razón social"
          error={errors.clientName?.message}
          {...register('clientName')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Fecha *"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />

        <Input
          label="Hora"
          type="time"
          error={errors.time?.message}
          {...register('time')}
        />

        <Input
          label="Duración (min)"
          type="number"
          placeholder="60"
          min={0}
          error={errors.duration?.message}
          {...register('duration')}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Notas
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Dirección, referencia, o cualquier detalle adicional..."
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            errors.notes
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-red-600" role="alert">
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {editAppointment ? 'Guardar cambios' : 'Crear turno'}
        </Button>
      </div>
    </form>
  )
}
