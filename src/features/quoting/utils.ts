import type { QuoteItem } from './types'

export function calculateSubtotal(items: QuoteItem[]): number {
  return items.reduce((sum, item) => {
    if (item.type === 'material') {
      return sum + item.quantity * item.unitPrice
    }
    return sum + item.laborHours * item.hourlyRate
  }, 0)
}

export function calculateIVA(subtotal: number, ivaPercent: number): number {
  return subtotal * (ivaPercent / 100)
}

export function calculateDiscount(subtotal: number, discountPercent: number): number {
  return subtotal * (discountPercent / 100)
}

export function calculateTotal(
  subtotal: number,
  iva: number,
  discount: number,
): number {
  return subtotal + iva - discount
}
