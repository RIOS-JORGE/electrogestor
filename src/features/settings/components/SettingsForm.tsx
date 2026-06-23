import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { settingsSchema, type Settings } from '../types'
import { useSettingsStore } from '../store'
import { Card, CardBody } from '../../../shared/components/Card'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { useToast } from '../../../shared/hooks/useToast'

export function SettingsForm() {
  const mpAlias = useSettingsStore((s) => s.mpAlias)
  const businessName = useSettingsStore((s) => s.businessName)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Settings>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: { mpAlias, businessName },
  })

  // Sync store values into the form on mount or when they change externally
  useEffect(() => {
    reset({ mpAlias, businessName })
  }, [mpAlias, businessName, reset])

  const onSubmit = useCallback(
    (data: Settings) => {
      updateSettings(data)
      addToast('Configuración guardada', 'success')
    },
    [updateSettings, addToast],
  )

  return (
    <Card padding="lg">
      <CardBody className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <Input
              label="Alias de Mercado Pago"
              placeholder="Ej: electrogestor.mp"
              error={errors.mpAlias?.message}
              {...register('mpAlias')}
            />

            <Input
              label="Nombre del negocio"
              placeholder="Ej: ElectroGestor Servicios"
              error={errors.businessName?.message}
              {...register('businessName')}
            />

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                Guardar configuración
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
