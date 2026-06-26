import { useState, useEffect, useCallback } from 'react'
import { useForm, FormProvider, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQuoteStore } from '../store'
import {
  quoteFormSchema,
  type QuoteFormData,
  type Quote,
  type QuoteStatus,
} from '../types'
import {
  calculateSubtotal,
  calculateIVA,
  calculateDiscount,
  calculateTotal,
} from '../utils'
import { useClientStore } from '../../clients/store'
import { ClientSelect } from '../../clients/components/ClientSelect'
import { MaterialRow } from './MaterialRow'
import { LaborRow } from './LaborRow'
import { QuoteSummary } from './QuoteSummary'
import { Card, CardHeader, CardBody } from '../../../shared/components/Card'
import { Button } from '../../../shared/components/Button'
import { Input } from '../../../shared/components/Input'
import { useIdGenerator } from '../../../shared/hooks/useIdGenerator'
import { useToast } from '../../../shared/hooks/useToast'

interface QuoteWizardProps {
  editQuote?: Quote
}

export function QuoteWizard({ editQuote }: QuoteWizardProps) {
  const navigate = useNavigate()
  const addQuote = useQuoteStore((s) => s.addQuote)
  const updateQuote = useQuoteStore((s) => s.updateQuote)
  const generateId = useIdGenerator()
  const { addToast } = useToast()
  const isEditMode = editQuote != null

  const methods = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema) as any,
    defaultValues: {
      clientId: undefined,
      clientName: '',
      items: [],
      includeIVA: true,
      discountPercent: 0,
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

  const watchedItems = watch('items')
  const watchedIVA = watch('includeIVA')
  const watchedDiscount = watch('discountPercent')

  // Client selection mode
  const [useExistingClient, setUseExistingClient] = useState(true)
  const clients = useClientStore((s) => s.clients)
  const watchClientId = watch('clientId')

  // Auto-fill clientName when an existing client is selected
  useEffect(() => {
    if (watchClientId) {
      const client = clients.find((c) => c.id === watchClientId)
      if (client) {
        setValue('clientName', client.name)
      }
    }
  }, [watchClientId, clients, setValue])

  // Populate form when editing an existing quote
  useEffect(() => {
    if (editQuote) {
      reset({
        clientId: editQuote.clientId || undefined,
        clientName: editQuote.clientName,
        items: editQuote.items.map((item) => ({ ...item })),
        includeIVA: editQuote.iva != null && editQuote.iva > 0,
        discountPercent: editQuote.discount ?? 0,
        notes: editQuote.notes || '',
      })
      setUseExistingClient(editQuote.clientId != null)
    }
  }, [editQuote, reset])

  const submitQuote = useCallback(
    async (data: QuoteFormData, status: QuoteStatus) => {
      const subtotal = calculateSubtotal(data.items)
      const ivaAmount = data.includeIVA ? calculateIVA(subtotal, 21) : 0
      const discountAmount = calculateDiscount(
        subtotal,
        data.discountPercent,
      )
      const total = calculateTotal(subtotal, ivaAmount, discountAmount)

      if (isEditMode && editQuote) {
        await updateQuote(editQuote.id, {
          clientId: data.clientId || undefined,
          clientName: data.clientName,
          items: data.items,
          subtotal,
          iva: data.includeIVA ? 21 : undefined,
          discount: data.discountPercent > 0 ? data.discountPercent : undefined,
          total,
          status,
          notes: data.notes || '',
        })
        addToast(
          status === 'draft'
            ? 'Presupuesto actualizado como borrador'
            : 'Presupuesto actualizado y enviado',
          'success',
        )
        navigate(`/cotizaciones/${editQuote.id}`)
      } else {
        const quote: Quote = {
          id: generateId(),
          clientId: data.clientId || undefined,
          clientName: data.clientName,
          items: data.items,
          subtotal,
          iva: data.includeIVA ? 21 : undefined,
          discount: data.discountPercent > 0 ? data.discountPercent : undefined,
          total,
          status,
          notes: data.notes || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        await addQuote(quote)
        addToast(
          status === 'draft'
            ? 'Presupuesto guardado como borrador'
            : 'Presupuesto creado y enviado',
          'success',
        )
        navigate('/cotizaciones')
      }
    },
    [addQuote, updateQuote, generateId, navigate, addToast, isEditMode, editQuote],
  )

  const onSaveDraft = handleSubmit((data: any) =>
    submitQuote(data as QuoteFormData, 'draft'),
  )
  const onSend = handleSubmit((data: any) =>
    submitQuote(data as QuoteFormData, 'sent'),
  )

  const handleUseExistingToggle = (useExisting: boolean) => {
    setUseExistingClient(useExisting)
    if (useExisting) {
      setValue('clientName', '')
    } else {
      setValue('clientId', undefined)
    }
  }

  const addMaterial = () => {
    append({
      id: generateId(),
      type: 'material',
      description: '',
      quantity: 1,
      unit: 'm',
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

  // Flatten errors for discriminated union fields
  const flatErrors = errors as Record<string, unknown>
  const itemsRootError = (
    (flatErrors.items as Record<string, unknown> | undefined)?.root as
      | Record<string, unknown>
      | undefined
  )?.message as string | undefined

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
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditMode ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </h2>
          </CardHeader>

          <CardBody className="space-y-8">
            {/* Section 1: Client selection */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
                1. Cliente
              </h3>

              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-existing-client"
                  checked={useExistingClient}
                  onChange={(e) => handleUseExistingToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600"
                />
                <label
                  htmlFor="use-existing-client"
                  className="text-sm text-gray-700 dark:text-gray-300"
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

            {/* Section 2: Items table */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
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
                <p className={`text-sm ${itemsRootError ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  Agregá al menos un material o mano de obra para comenzar.
                </p>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const item = field as { type: 'material' | 'labor' }
                    if (item.type === 'material') {
                      return (
                        <MaterialRow
                          key={field.id}
                          index={index}
                          onRemove={() => remove(index)}
                        />
                      )
                    }
                    return (
                      <LaborRow
                        key={field.id}
                        index={index}
                        onRemove={() => remove(index)}
                      />
                    )
                  })}
                </div>
              )}

              {itemsRootError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                  {itemsRootError}
                </p>
              )}
            </section>

            {/* Section 3: Notes */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
                Notas
              </h3>
              <div className="space-y-1">
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Notas adicionales
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Condiciones de pago, validez de la cotización, etc."
                  className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    errors.notes
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </section>

            {/* Section 4: IVA and discount */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
                Impuestos y descuentos
              </h3>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600"
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

            {/* Section 5: Summary */}
            <section>
              <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
                Resumen
              </h3>
              <QuoteSummary
                items={watchedItems as any}
                includeIVA={watchedIVA}
                discountPercent={watchedDiscount}
              />
            </section>

            {/* Actions */}
            <div className="no-print flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/cotizaciones')}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={isSubmitting}
                onClick={onSaveDraft}
              >
                Guardar borrador
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={onSend}
              >
                Guardar y enviar
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </FormProvider>
  )
}
