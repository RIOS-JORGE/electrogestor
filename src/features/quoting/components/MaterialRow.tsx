import { useFormContext } from 'react-hook-form'
import { Input } from '../../../shared/components/Input'
import { Select } from '../../../shared/components/Select'
import { Button } from '../../../shared/components/Button'
import { UNIT_OPTIONS, type QuoteFormData, type Unit } from '../types'

interface MaterialRowProps {
  index: number
  onRemove: () => void
}

const unitLabels: Record<Unit, string> = {
  m: 'm',
  u: 'u',
  kg: 'kg',
  h: 'h',
}

const unitOptions = UNIT_OPTIONS.map((u) => ({
  value: u,
  label: unitLabels[u],
}))

export function MaterialRow({ index, onRemove }: MaterialRowProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormData>()

  const itemErrors = (errors as Record<string, unknown>)?.items as Record<string, unknown>[] | undefined
  const rowErrors = itemErrors?.[index] as Record<string, unknown> | undefined

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 sm:flex-row sm:items-end sm:gap-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0">
      <div className="w-full sm:min-w-[180px] sm:flex-1">
        <Input
          label="Descripción"
          placeholder="Descripción del material"
          error={(rowErrors?.description as Record<string, unknown> | undefined)?.message as string | undefined}
          {...register(`items.${index}.description` as const)}
        />
      </div>
      <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
        <div className="w-[70px] flex-none">
          <Input
            label="Cant."
            type="number"
            step="any"
            min="0"
            placeholder="0"
            error={(rowErrors?.quantity as Record<string, unknown> | undefined)?.message as string | undefined}
            {...register(`items.${index}.quantity` as any, { valueAsNumber: true })}
          />
        </div>
        <div className="w-[60px] flex-none">
          <Select
            label="Ud."
            options={unitOptions}
            error={(rowErrors?.unit as Record<string, unknown> | undefined)?.message as string | undefined}
            {...register(`items.${index}.unit` as any)}
          />
        </div>
        <div className="w-[90px] flex-none">
          <Input
            label="P. unit."
            type="number"
            step="any"
            min="0"
            placeholder="0"
            error={(rowErrors?.unitPrice as Record<string, unknown> | undefined)?.message as string | undefined}
            {...register(`items.${index}.unitPrice` as any, { valueAsNumber: true })}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
          aria-label="Eliminar material"
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
    </div>
  )
}
