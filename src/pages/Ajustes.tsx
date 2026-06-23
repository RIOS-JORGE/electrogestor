import { useEffect } from 'react'
import { Card, CardHeader } from '../shared/components/Card'
import { SettingsForm } from '../features/settings/components/SettingsForm'

export function AjustesPage() {
  useEffect(() => {
    document.title = 'Ajustes | ElectroGestor'
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Ajustes</h2>
      </div>

      <Card padding="lg">
        <CardHeader>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuración general</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Datos de tu negocio y medios de cobro
          </p>
        </CardHeader>
        <SettingsForm />
      </Card>
    </div>
  )
}
