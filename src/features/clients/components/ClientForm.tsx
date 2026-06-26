import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useClientStore } from '../store'
import { clientFormSchema, type Client } from '../types'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { useIdGenerator } from '../../../shared/hooks/useIdGenerator'
import { useToast } from '../../../shared/hooks/useToast'

interface ClientFormProps {
  client?: Client
}

type FormValues = {
  name: string
  phone?: string | undefined
  email?: string | undefined
  address?: string | undefined
  notes?: string | undefined
}

export function ClientForm({ client }: ClientFormProps) {
  const navigate = useNavigate()
  const addClient = useClientStore((s) => s.addClient)
  const updateClient = useClientStore((s) => s.updateClient)
  const generateId = useIdGenerator()
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client
      ? {
          name: client.name,
          phone: client.phone,
          email: client.email,
          address: client.address,
          notes: client.notes,
        }
      : {
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        },
  })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const normalized = {
      name: data.name,
      phone: data.phone ?? '',
      email: data.email ?? '',
      address: data.address ?? '',
      notes: data.notes ?? '',
    }
    if (client) {
      await updateClient(client.id, normalized)
      addToast('Cliente actualizado', 'success')
      navigate('/clientes')
    } else {
      const now = Date.now()
      await addClient({
        id: generateId(),
        ...normalized,
        createdAt: now,
        updatedAt: now,
      })
      addToast('Cliente creado', 'success')
      navigate('/clientes')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre *"
        placeholder="Nombre del cliente"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Teléfono"
        placeholder="+54 11 1234-5678"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <Input
        label="Email"
        type="email"
        placeholder="cliente@ejemplo.com"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Dirección"
        placeholder="Calle y número"
        error={errors.address?.message}
        {...register('address')}
      />

      <div className="space-y-1">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Notas
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Información adicional..."
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
            errors.notes
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
          }`}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.notes.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/clientes')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {client ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
