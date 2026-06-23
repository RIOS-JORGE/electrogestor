import { useFormContext } from 'react-hook-form'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import type { QuoteFormData } from '../types'

interface LaborRowProps {
  index: number
  onRemove: () => void
}

export function LaborRow({ index, onRemove }: LaborRowProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormData>()

  const itemErrors = (errors as Record<string, unknown>)?.items as Record<string, unknown>[] | undefined
  const rowErrors = itemErrors?.[index] as Record<string, unknown> | undefined

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-[180px] flex-1">
        <Input
          label="Descripción"
          placeholder="Descripción de la tarea"
          error={(rowErrors?.description as Record<string, unknown> | undefined)?.message as string | undefined}
          {...register(`items.${index}.description` as const)}
        />
      </div>
      <div className="w-20">
        <Input
          label="Horas"
          type="number"
          step="any"
          min="0"
          placeholder="0"
          error={(rowErrors?.laborHours as Record<string, unknown> | undefined)?.message as string | undefined}
          {...register(`items.${index}.laborHours` as any, { valueAsNumber: true })}
        />
      </div>
      <div className="w-24">
        <Input
          label="$/hora"
          type="number"
          step="any"
          min="0"
          placeholder="0"
          error={(rowErrors?.hourlyRate as Record<string, unknown> | undefined)?.message as string | undefined}
          {...register(`items.${index}.hourlyRate` as any, { valueAsNumber: true })}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="mb-1 text-red-500 hover:text-red-700"
        aria-label="Eliminar mano de obra"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </Button>
    </div>
  )
}
