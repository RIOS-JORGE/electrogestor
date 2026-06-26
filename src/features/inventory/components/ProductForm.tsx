import { useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useInventoryStore } from '../store'
import {
  productFormSchema,
  CATEGORY_OPTIONS_LABELED,
  UNIT_OPTIONS_LABELED,
  type ProductFormData,
  type Product,
} from '../types'
import { Card, CardBody } from '../../../shared/components/Card'
import { Input } from '../../../shared/components/Input'
import { Select } from '../../../shared/components/Select'
import { Button } from '../../../shared/components/Button'
import { useToast } from '../../../shared/hooks/useToast'

interface ProductFormProps {
  editProduct?: Product
}

export function ProductForm({ editProduct }: ProductFormProps) {
  const navigate = useNavigate()
  const addProduct = useInventoryStore((s) => s.addProduct)
  const updateProduct = useInventoryStore((s) => s.updateProduct)
  const { addToast } = useToast()
  const isEditMode = editProduct != null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: {
      name: '',
      category: 'otro',
      unit: 'u',
      stock: 0,
      minStock: 0,
      unitPrice: undefined,
      notes: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (editProduct) {
      reset({
        name: editProduct.name,
        category: editProduct.category,
        unit: editProduct.unit,
        stock: editProduct.stock,
        minStock: editProduct.minStock,
        unitPrice: editProduct.unitPrice ?? undefined,
        notes: editProduct.notes ?? '',
      })
    }
  }, [editProduct, reset])

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      if (isEditMode && editProduct) {
        await updateProduct(editProduct.id, {
          name: data.name.trim(),
          category: data.category,
          unit: data.unit,
          stock: data.stock,
          minStock: data.minStock,
          unitPrice: data.unitPrice || undefined,
          notes: data.notes || undefined,
        })
        addToast('Producto actualizado', 'success')
        navigate(`/inventario/${editProduct.id}`)
      } else {
        const now = Date.now()
        const productId = await addProduct({
          ...data,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        })
        if (productId) {
          addToast('Producto guardado', 'success')
          navigate('/inventario')
        }
      }
    },
    [addProduct, updateProduct, navigate, addToast, isEditMode, editProduct],
  )

  return (
    <Card padding="lg">
      <CardBody className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            {/* Name */}
            <Input
              label="Nombre del producto *"
              placeholder="Ej: Cable THHN 12"
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Category and Unit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Categoría *"
                options={CATEGORY_OPTIONS_LABELED}
                placeholder="Seleccionar categoría"
                error={errors.category?.message}
                {...register('category')}
              />
              <Select
                label="Unidad *"
                options={UNIT_OPTIONS_LABELED}
                placeholder="Seleccionar unidad"
                error={errors.unit?.message}
                {...register('unit')}
              />
            </div>

            {/* Stock and Min Stock */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Stock actual"
                type="number"
                min="0"
                placeholder="0"
                error={errors.stock?.message}
                {...register('stock', { valueAsNumber: true })}
              />
              <Input
                label="Stock mínimo"
                type="number"
                min="0"
                placeholder="0"
                error={errors.minStock?.message}
                {...register('minStock', { valueAsNumber: true })}
              />
            </div>

            {/* Unit Price */}
            <Input
              label="Precio unitario ($)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              error={errors.unitPrice?.message}
              {...register('unitPrice', { valueAsNumber: true })}
            />

            {/* Notes */}
            <div className="space-y-1">
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700"
              >
                Notas
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Ubicación, proveedor, observaciones..."
                className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                  errors.notes
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                {...register('notes')}
              />
              {errors.notes && (
                <p className="text-sm text-red-600" role="alert">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/inventario')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isEditMode ? 'Guardar cambios' : 'Guardar producto'}
              </Button>
            </div>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
