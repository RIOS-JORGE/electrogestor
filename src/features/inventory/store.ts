import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, ProductFormData, StockMovement, MovementType } from './types'
import { productSchema, stockMovementSchema } from './types'
import { useToastStore } from '../../shared/hooks/useToast'

// ── Store interface ──────────────────────────────────────────────────────────

interface InventoryStore {
  products: Product[]
  movements: StockMovement[]

  /** Returns the created Product, or undefined if name already exists. */
  addProduct: (data: ProductFormData) => string | undefined
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => void
  deleteProduct: (id: string) => void
  getProductById: (id: string) => Product | undefined

  /**
   * Adjusts stock by creating a movement record.
   * @param quantity — signed delta applied to product.stock
   */
  adjustStock: (productId: string, quantity: number, type: MovementType, reason?: string) => void
  getMovementsByProduct: (productId: string) => StockMovement[]
  getLowStockProducts: () => Product[]
  getAlertsCount: () => number
}

// ── Validation helpers ───────────────────────────────────────────────────────

function hasDuplicateName(products: Product[], name: string, excludeId?: string): boolean {
  const normalized = name.trim().toLowerCase()
  return products.some(
    (p) => p.name.trim().toLowerCase() === normalized && p.id !== excludeId,
  )
}

// ── Store implementation ─────────────────────────────────────────────────────

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: [],
      movements: [],

      addProduct: (data) => {
        const { products } = get()
        if (hasDuplicateName(products, data.name)) {
          useToastStore.getState().addToast('Ya existe un producto con ese nombre', 'error')
          return undefined
        }

        const now = Date.now()
        const product: Product = {
          id: crypto.randomUUID(),
          name: data.name.trim(),
          category: data.category,
          unit: data.unit,
          stock: data.stock,
          minStock: data.minStock,
          unitPrice: data.unitPrice || undefined,
          notes: data.notes || undefined,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({ products: [...state.products, product] }))
        return product.id
      },

      updateProduct: (id, data) => {
        const { products } = get()
        const existing = products.find((p) => p.id === id)
        if (!existing) {
          useToastStore.getState().addToast('Producto no encontrado', 'error')
          return
        }

        if (data.name && hasDuplicateName(products, data.name, id)) {
          useToastStore.getState().addToast('Ya existe un producto con ese nombre', 'error')
          return
        }

        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p,
          ),
        }))
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          movements: state.movements.filter((m) => m.productId !== id),
        }))
      },

      getProductById: (id) => get().products.find((p) => p.id === id),

      adjustStock: (productId, quantity, type, reason) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product) {
          useToastStore.getState().addToast('Producto no encontrado', 'error')
          return
        }

        const newStock = product.stock + quantity
        if (newStock < 0) {
          useToastStore.getState().addToast('El stock no puede ser negativo', 'error')
          return
        }

        const movement: StockMovement = {
          id: crypto.randomUUID(),
          productId,
          type,
          quantity,
          reason,
          createdAt: Date.now(),
        }

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, stock: newStock, updatedAt: Date.now() } : p,
          ),
          movements: [...state.movements, movement],
        }))
      },

      getMovementsByProduct: (productId) =>
        get()
          .movements.filter((m) => m.productId === productId)
          .sort((a, b) => b.createdAt - a.createdAt),

      getLowStockProducts: () =>
        get().products.filter((p) => p.stock <= p.minStock),

      getAlertsCount: () =>
        get().products.filter((p) => p.stock <= p.minStock).length,
    }),
    {
      name: 'electrogestor-inventory',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error al cargar datos de inventario:', error)
          useToastStore.getState().addToast(
            'Error al cargar datos de inventario guardados',
            'error',
          )
          return
        }

        if (!state) return

        // Validate rehydrated products
        const validProducts: Product[] = []
        for (const raw of state.products) {
          const result = productSchema.safeParse(raw)
          if (result.success) {
            validProducts.push(result.data)
          } else {
            console.warn('Producto inválido en localStorage, ignorado:', result.error)
          }
        }

        // Validate rehydrated movements
        const validMovements: StockMovement[] = []
        for (const raw of state.movements) {
          const result = stockMovementSchema.safeParse(raw)
          if (result.success) {
            validMovements.push(result.data)
          } else {
            console.warn('Movimiento inválido en localStorage, ignorado:', result.error)
          }
        }

        // Replace state with validated data
        state.products = validProducts
        state.movements = validMovements
      },
    },
  ),
)
