import { useState } from 'react'
import type { DateRange } from '../types'

interface DateRangeFilterProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const presets = [
  { label: 'Este mes', preset: 'month' as const },
  { label: 'Último trimestre', preset: 'quarter' as const },
  { label: 'Este año', preset: 'year' as const },
]

function getPresetRange(preset: 'month' | 'quarter' | 'year'): DateRange {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  if (preset === 'quarter') {
    start.setMonth(now.getMonth() - 2)
  } else if (preset === 'year') {
    start.setMonth(0)
    start.setDate(1)
    end.setMonth(11)
    end.setDate(31)
  }

  return { start, end, preset }
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState(value.preset || 'month')

  const handlePreset = (preset: 'month' | 'quarter' | 'year') => {
    setActivePreset(preset)
    onChange(getPresetRange(preset))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.preset}
          onClick={() => handlePreset(p.preset)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activePreset === p.preset
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {value.start.toLocaleDateString('es-AR')} — {value.end.toLocaleDateString('es-AR')}
      </span>
    </div>
  )
}