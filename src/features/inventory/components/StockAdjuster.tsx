import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { useInventoryStore } from '../store'
import { useToast } from '../../../shared/hooks/useToast'
import type { MovementType } from '../types'

const MOVEMENT_TYPE_OPTIONS: { value: MovementType; label: string }[] = [
  { value: 'in', label: 'Entrada' },
  { value: 'out', label: 'Salida' },
  { value: 'adjustment', label: 'Ajuste' },
]

interface StockAdjusterProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

export function StockAdjuster({ productId, isOpen, onClose }: StockAdjusterProps) {
  const adjustStock = useInventoryStore((s) => s.adjustStock)
  const product = useInventoryStore((s) => s.products.find((p) => p.id === productId))
  const { addToast } = useToast()

  const [type, setType] = useState<MovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const isAdjustment = type === 'adjustment'
  const raw = Number(quantity)
  const isValid = quantity !== '' && !isNaN(raw) && (isAdjustment ? raw !== 0 : raw > 0)

  const handleConfirm = () => {
    if (!isValid) return

    const signedDelta = isAdjustment ? raw : type === 'out' ? -raw : raw
    adjustStock(productId, signedDelta, type, reason.trim() || undefined)
    addToast('Stock actualizado', 'success')
    handleClose()
  }

  const handleClose = () => {
    setType('in')
    setQuantity('')
    setReason('')
    onClose()
  }

  if (!product) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Ajustar stock: ${product.name}`} size="sm">
      <div className="space-y-4">
        {/* Current stock */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Stock actual:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{product.stock}</span>
        </p>

        {/* Type selector */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tipo de movimiento
          </label>
          <div className="flex gap-2">
            {MOVEMENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  type === opt.value
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1">
          <label htmlFor="adjust-qty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Cantidad
            {!isAdjustment && type === 'in' && (
              <span className="ml-1 text-green-600 dark:text-green-400">(se sumará al stock)</span>
            )}
            {!isAdjustment && type === 'out' && (
              <span className="ml-1 text-red-600 dark:text-red-400">(se restará del stock)</span>
            )}
            {isAdjustment && (
              <span className="ml-1 text-gray-500 dark:text-gray-400">(usá valores negativos para restar)</span>
            )}
          </label>
          <input
            id="adjust-qty"
            type="number"
            {...(isAdjustment ? {} : { min: '1' })}
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={isAdjustment ? 'Ej: 10 o -5' : '0'}
          />
        </div>

        {/* Reason */}
        <div className="space-y-1">
          <label htmlFor="adjust-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
          </label>
          <input
            id="adjust-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Reposición de stock"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!isValid}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
