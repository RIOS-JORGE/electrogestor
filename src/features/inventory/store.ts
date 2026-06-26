import { create } from 'zustand'
import type { Product, StockMovement, MovementType } from './types'
import { getCompanyId } from '../../lib/supabase'
import {
  getAllProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
  adjustStock as apiAdjustStock,
  createMovement as apiCreateMovement,
  getAllMovements,
} from './api'
import { useToastStore } from '../../shared/hooks/useToast'

// ── Store interface ──────────────────────────────────────────────────────────

interface InventoryStore {
  products: Product[]
  movements: StockMovement[]
  loaded: boolean

  /** Load all products and movements from Supabase. */
  loadAll: () => Promise<void>

  /** Returns the created Product's id, or undefined if name already exists. */
  addProduct: (data: Product) => Promise<string | undefined>
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  getProductById: (id: string) => Product | undefined

  /**
   * Adjusts stock by creating a movement record.
   * @param quantity — signed delta applied to product.stock
   */
  adjustStock: (productId: string, quantity: number, type: MovementType, reason?: string) => Promise<void>
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

export const useInventoryStore = create<InventoryStore>()((set, get) => ({
  products: [],
  movements: [],
  loaded: false,

  loadAll: async () => {
    try {
      const companyId = getCompanyId()
      const productsResult = await getAllProducts(companyId)
      const movementsResult = await getAllMovements(companyId)

      if (productsResult.data) {
        set({
          products: productsResult.data,
          movements: movementsResult.data ?? [],
          loaded: true,
        })
      } else {
        console.error('Error al cargar productos:', productsResult.error)
      }
    } catch (err) {
      console.error('Error al cargar productos:', err)
    }
  },

  addProduct: async (product) => {
    const { products } = get()
    if (hasDuplicateName(products, product.name)) {
      useToastStore.getState().addToast('Ya existe un producto con ese nombre', 'error')
      return undefined
    }

    const companyId = getCompanyId()
    const result = await apiCreateProduct(product, companyId)
    if (result.data) {
      set((state) => ({ products: [...state.products, result.data!] }))
      return result.data.id
    } else {
      useToastStore.getState().addToast('Error al guardar producto', 'error')
      throw new Error(result.error ?? 'Error al guardar producto')
    }
  },

  updateProduct: async (id, data) => {
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

    const companyId = getCompanyId()
    const result = await apiUpdateProduct(id, data, companyId)
    if (result.data) {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? result.data! : p,
        ),
      }))
    } else {
      useToastStore.getState().addToast('Error al actualizar producto', 'error')
      throw new Error(result.error ?? 'Error al actualizar producto')
    }
  },

  deleteProduct: async (id) => {
    try {
      const companyId = getCompanyId()
      const result = await apiDeleteProduct(id, companyId)
      if (!result.error) {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          movements: state.movements.filter((m) => m.productId !== id),
        }))
      } else {
        useToastStore.getState().addToast('Error al eliminar producto', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al eliminar producto', 'error')
    }
  },

  getProductById: (id) => get().products.find((p) => p.id === id),

  adjustStock: async (productId, quantity, type, reason) => {
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

    try {
      const companyId = getCompanyId()

      // Update stock in DB
      const stockResult = await apiAdjustStock(productId, companyId, newStock)
      if (!stockResult.data) {
        useToastStore.getState().addToast('Error al ajustar stock', 'error')
        return
      }

      // Create movement record
      const movement: StockMovement = {
        id: crypto.randomUUID(),
        productId,
        type,
        quantity,
        reason,
        createdAt: Date.now(),
      }

      const movResult = await apiCreateMovement(movement, companyId)
      if (movResult.data) {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? stockResult.data! : p,
          ),
          movements: [...state.movements, movResult.data!],
        }))
      } else {
        // Stock was updated in DB but movement failed — still update local product
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? stockResult.data! : p,
          ),
        }))
        useToastStore.getState().addToast('Error al registrar movimiento de stock', 'error')
      }
    } catch {
      useToastStore.getState().addToast('Error al ajustar stock', 'error')
    }
  },

  getMovementsByProduct: (productId) =>
    get()
      .movements.filter((m) => m.productId === productId)
      .sort((a, b) => b.createdAt - a.createdAt),

  getLowStockProducts: () =>
    get().products.filter((p) => p.stock <= p.minStock),

  getAlertsCount: () =>
    get().products.filter((p) => p.stock <= p.minStock).length,
}))
