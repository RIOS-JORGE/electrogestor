import { useState, useEffect, useCallback } from 'react'
import { useForm, FormProvider, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useInvoiceStore } from '../store'
import {
  invoiceFormSchema,
  type InvoiceFormData,
  type Invoice,
} from '../types'
import {
  calculateSubtotal,
  calculateIVA,
  calculateDiscount,
  calculateTotal,
} from '../../quoting/utils'
import { useClientStore } from '../../clients/store'
import { ClientSelect } from '../../clients/components/ClientSelect'
import { Card, CardBody } from '../../../shared/components/Card'
import { Input } from '../../../shared/components/Input'
import { Select } from '../../../shared/components/Select'
import { Button } from '../../../shared/components/Button'
import { useIdGenerator } from '../../../shared/hooks/useIdGenerator'
import { useToast } from '../../../shared/hooks/useToast'
import { UNIT_OPTIONS, type QuoteItem, type Unit } from '../../quoting/types'

interface InvoiceFormProps {
  editInvoice?: Invoice
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

export function InvoiceForm({ editInvoice }: InvoiceFormProps) {
  const navigate = useNavigate()
  const addInvoice = useInvoiceStore((s) => s.addInvoice)
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice)
  const getNextNumber = useInvoiceStore((s) => s.getNextNumber)
  const generateId = useIdGenerator()
  const { addToast } = useToast()
  const isEditMode = editInvoice != null

  const methods = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: {
      clientId: undefined,
      clientName: '',
      items: [],
      includeIVA: true,
      discountPercent: 0,
      dueDate: undefined,
      notes: '',
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = methods

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const [dueDateStr, setDueDateStr] = useState('')

  const watchedItems = watch('items')
  const watchedIVA = watch('includeIVA')
  const watchedDiscount = watch('discountPercent')

  // Client selection mode
  const [useExistingClient, setUseExistingClient] = useState(true)
  const clients = useClientStore((s) => s.clients)
  const watchClientId = watch('clientId')

  // Auto-fill clientName when existing client is selected
  useEffect(() => {
    if (watchClientId) {
      const client = clients.find((c) => c.id === watchClientId)
      if (client) {
        setValue('clientName', client.name)
      }
    }
  }, [watchClientId, clients, setValue])

  // Populate form when editing
  useEffect(() => {
    if (editInvoice) {
      reset({
        clientId: editInvoice.clientId || undefined,
        clientName: editInvoice.clientName,
        items: editInvoice.items.map((item) => ({ ...item })) as any,
        includeIVA: editInvoice.iva != null && editInvoice.iva > 0,
        discountPercent: editInvoice.discount ?? 0,
        dueDate: editInvoice.dueDate || undefined,
        notes: editInvoice.notes || '',
      })
      if (editInvoice.dueDate) {
        setDueDateStr(new Date(editInvoice.dueDate).toISOString().split('T')[0])
      } else {
        setDueDateStr('')
      }
      setUseExistingClient(editInvoice.clientId != null)
    }
  }, [editInvoice, reset])

  const submitInvoice = useCallback(
    (data: InvoiceFormData) => {
      const subtotal = calculateSubtotal(data.items as QuoteItem[])
      const ivaAmount = data.includeIVA ? calculateIVA(subtotal, 21) : 0
      const discountAmount = calculateDiscount(subtotal, data.discountPercent)
      const total = calculateTotal(subtotal, ivaAmount, discountAmount)

      if (isEditMode && editInvoice) {
        updateInvoice(editInvoice.id, {
          clientId: data.clientId || undefined,
          clientName: data.clientName,
          items: data.items as any,
          subtotal,
          iva: data.includeIVA ? 21 : undefined,
          discount: data.discountPercent > 0 ? data.discountPercent : undefined,
          dueDate: data.dueDate,
          total,
          notes: data.notes || '',
        })
        addToast('Factura actualizada', 'success')
        navigate(`/facturacion/${editInvoice.id}`)
      } else {
        const invoice: Invoice = {
          id: generateId(),
          number: getNextNumber(),
          clientId: data.clientId || undefined,
          clientName: data.clientName,
          items: data.items as any,
          subtotal,
          iva: data.includeIVA ? 21 : undefined,
          discount: data.discountPercent > 0 ? data.discountPercent : undefined,
          dueDate: data.dueDate,
          total,
          status: 'draft',
          notes: data.notes || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        addInvoice(invoice)
        addToast('Factura guardada como borrador', 'success')
        navigate('/facturacion')
      }
    },
    [addInvoice, updateInvoice, generateId, navigate, addToast, isEditMode, editInvoice, getNextNumber],
  )

  const onSaveDraft = handleSubmit((data: any) =>
    submitInvoice(data as InvoiceFormData),
  )

  const addMaterial = () => {
    append({
      id: generateId(),
      type: 'material',
      description: '',
      quantity: 1,
      unit: 'm' as Unit,
      unitPrice: 0,
    } as any)
  }

  const addLabor = () => {
    append({
      id: generateId(),
      type: 'labor',
      description: '',
      laborHours: 1,
      hourlyRate: 0,
    } as any)
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDueDateStr(val)
    if (val) {
      const timestamp = new Date(val + 'T12:00:00').getTime()
      setValue('dueDate', timestamp, { shouldDirty: true })
    } else {
      setValue('dueDate', undefined, { shouldDirty: true })
    }
  }

  const handleUseExistingToggle = (useExisting: boolean) => {
    setUseExistingClient(useExisting)
    if (useExisting) {
      setValue('clientName', '')
    } else {
      setValue('clientId', undefined)
    }
  }

  // Flatten errors for discriminated union fields
  const flatErrors = errors as Record<string, unknown>
  const itemsRootError = (
    (flatErrors.items as Record<string, unknown> | undefined)?.root as
      | Record<string, unknown>
      | undefined
  )?.message as string | undefined

  // Live totals
  const subtotal = calculateSubtotal(watchedItems as any)
  const ivaAmount = watchedIVA ? calculateIVA(subtotal, 21) : 0
  const discountAmount = calculateDiscount(subtotal, watchedDiscount)
  const total = calculateTotal(subtotal, ivaAmount, discountAmount)

  useEffect(() => {
    if (isDirty && !isSubmitting) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [isDirty, isSubmitting])

  return (
    <FormProvider {...methods}>
      <form>
        <Card padding="lg">
          <CardBody className="space-y-8">
            {/* Section 1: Client selection */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                1. Cliente
              </h3>

              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-existing-client"
                  checked={useExistingClient}
                  onChange={(e) => handleUseExistingToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label
                  htmlFor="use-existing-client"
                  className="text-sm text-gray-700"
                >
                  Usar cliente existente
                </label>
              </div>

              {useExistingClient ? (
                <ClientSelect
                  error={errors.clientId?.message}
                  registration={register('clientId')}
                />
              ) : (
                <Input
                  label="Nombre del cliente *"
                  placeholder="Cliente ocasional"
                  error={errors.clientName?.message}
                  {...register('clientName')}
                />
              )}
            </section>

            {/* Section 2: Items */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                2. Items
              </h3>

              <div className="mb-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMaterial}
                >
                  + Material
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLabor}
                >
                  + Mano de obra
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className={`text-sm ${itemsRootError ? 'text-red-600' : 'text-gray-400'}`}>
                  Agregá al menos un material o mano de obra para comenzar.
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const item = field as { type: 'material' | 'labor' }
                    const itemErrors = (flatErrors.items as Record<string, unknown>[] | undefined)
                    const rowErrors = itemErrors?.[index] as Record<string, unknown> | undefined

                    if (item.type === 'material') {
                      return (
                        <div key={field.id} className="flex flex-wrap items-end gap-2">
                          <div className="min-w-[180px] flex-1">
                            <Input
                              label="Descripción"
                              placeholder="Descripción del material"
                              error={(rowErrors?.description as Record<string, unknown> | undefined)?.message as string | undefined}
                              {...register(`items.${index}.description` as const)}
                            />
                          </div>
                          <div className="w-20">
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
                          <div className="w-16">
                            <Select
                              label="Ud."
                              options={unitOptions}
                              error={(rowErrors?.unit as Record<string, unknown> | undefined)?.message as string | undefined}
                              {...register(`items.${index}.unit` as any)}
                            />
                          </div>
                          <div className="w-24">
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
                            onClick={() => remove(index)}
                            className="mb-1 text-red-500 hover:text-red-700"
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
                      )
                    }

                    return (
                      <div key={field.id} className="flex flex-wrap items-end gap-2">
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
                          onClick={() => remove(index)}
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
                  })}
                </div>
              )}

              {itemsRootError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {itemsRootError}
                </p>
              )}
            </section>

            {/* Section 3: Notes */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                Notas
              </h3>
              <div className="space-y-1">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Notas adicionales
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Condiciones de pago, vencimiento, etc."
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
            </section>

            {/* Section 4: Due date */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                Fecha de vencimiento
              </h3>
              <div className="max-w-xs">
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Vencimiento (opcional)
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDateStr}
                  onChange={handleDueDateChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            {/* Section 5: IVA and discount */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                Impuestos y descuentos
              </h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    {...register('includeIVA')}
                  />
                  Incluir IVA (21%)
                </label>

                <div className="w-32">
                  <Input
                    label="Descuento %"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="0"
                    error={errors.discountPercent?.message}
                    {...register('discountPercent', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </section>

            {/* Section 6: Summary */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                Resumen
              </h3>
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {watchedIVA && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>IVA (21%)</span>
                    <span>${ivaAmount.toFixed(2)}</span>
                  </div>
                )}
                {watchedDiscount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Descuento ({watchedDiscount}%)</span>
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
            </section>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/facturacion')}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isSubmitting}
                onClick={onSaveDraft}
              >
                {isEditMode ? 'Guardar cambios' : 'Guardar borrador'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </FormProvider>
  )
}
