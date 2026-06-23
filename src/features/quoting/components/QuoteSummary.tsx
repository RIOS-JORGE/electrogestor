import type { QuoteItem } from '../types'
import { calculateSubtotal, calculateIVA, calculateDiscount, calculateTotal } from '../utils'

interface QuoteSummaryProps {
  items: QuoteItem[]
  includeIVA: boolean
  discountPercent: number
}

export function QuoteSummary({ items, includeIVA, discountPercent }: QuoteSummaryProps) {
  const subtotal = calculateSubtotal(items)
  const ivaAmount = includeIVA ? calculateIVA(subtotal, 21) : 0
  const discountAmount = calculateDiscount(subtotal, discountPercent)
  const total = calculateTotal(subtotal, ivaAmount, discountAmount)

  return (
    <div className="space-y-2 rounded-lg bg-gray-50 p-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>

      {includeIVA && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>IVA (21%)</span>
          <span>${ivaAmount.toFixed(2)}</span>
        </div>
      )}

      {discountPercent > 0 && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Descuento ({discountPercent}%)</span>
          <span className="text-red-600">-${discountAmount.toFixed(2)}</span>
        </div>
      )}

      <div className="border-t border-gray-300 pt-2">
        <div className="flex justify-between text-base font-semibold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
