import { useClientStore } from '../store'
import { Select } from '../../../shared/components/Select'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface ClientSelectProps {
  error?: string
  registration: UseFormRegisterReturn
}

export function ClientSelect({ error, registration }: ClientSelectProps) {
  const clients = useClientStore((s) => s.clients)

  const options = clients.map((c) => ({
    value: c.id,
    label: `${c.name}${c.phone ? ` — ${c.phone}` : ''}`,
  }))

  return (
    <Select
      label="Cliente"
      placeholder="Seleccionar cliente..."
      options={options}
      error={error}
      {...registration}
    />
  )
}
