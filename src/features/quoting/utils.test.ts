import { describe, it, expect } from 'vitest'
import { calculateSubtotal, calculateIVA, calculateDiscount, calculateTotal } from './utils'
import type { MaterialItem, LaborItem } from './types'

describe('calculateSubtotal', () => {
  it('calculates subtotal with 2 materials and 1 labor', () => {
    const items: (MaterialItem | LaborItem)[] = [
      { id: '1', type: 'material', description: 'Cable', quantity: 10, unit: 'm', unitPrice: 5 },
      { id: '2', type: 'material', description: 'Switch', quantity: 2, unit: 'u', unitPrice: 15 },
      { id: '3', type: 'labor', description: 'Instalación', laborHours: 3, hourlyRate: 50 },
    ]
    // 10*5 + 2*15 + 3*50 = 50 + 30 + 150 = 230
    expect(calculateSubtotal(items)).toBe(230)
  })

  it('returns 0 for empty items', () => {
    expect(calculateSubtotal([])).toBe(0)
  })

  it('calculates with a single material item', () => {
    const items: MaterialItem[] = [
      { id: '1', type: 'material', description: 'Cable', quantity: 5, unit: 'm', unitPrice: 10 },
    ]
    expect(calculateSubtotal(items)).toBe(50)
  })

  it('calculates with a single labor item', () => {
    const items: LaborItem[] = [
      { id: '1', type: 'labor', description: 'Mano de obra', laborHours: 8, hourlyRate: 45 },
    ]
    expect(calculateSubtotal(items)).toBe(360)
  })
})

describe('calculateIVA', () => {
  it('calculates 21% IVA on subtotal', () => {
    expect(calculateIVA(100, 21)).toBe(21)
  })

  it('returns 0 for 0% IVA', () => {
    expect(calculateIVA(100, 0)).toBe(0)
  })

  it('handles decimal subtotals', () => {
    expect(calculateIVA(99.99, 21)).toBeCloseTo(20.9979, 4)
  })
})

describe('calculateDiscount', () => {
  it('calculates 10% discount on subtotal', () => {
    expect(calculateDiscount(200, 10)).toBe(20)
  })

  it('returns 0 for 0% discount', () => {
    expect(calculateDiscount(200, 0)).toBe(0)
  })

  it('handles 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(100)
  })
})

describe('calculateTotal', () => {
  it('calculates total with IVA and no discount', () => {
    expect(calculateTotal(100, 21, 0)).toBe(121)
  })

  it('calculates total with IVA and discount', () => {
    expect(calculateTotal(100, 21, 10)).toBe(111)
  })

  it('calculates total without IVA', () => {
    expect(calculateTotal(100, 0, 0)).toBe(100)
  })
})
