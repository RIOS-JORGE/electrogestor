import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuoteStore } from '../features/quoting/store'
import { Badge } from '../shared/components/Badge'
import { Button } from '../shared/components/Button'
import { DropdownMenu } from '../shared/components/DropdownMenu'

import { Card, CardHeader, CardBody } from '../shared/components/Card'
import { Modal } from '../shared/components/Modal'
import { QuotePreview } from '../features/quoting/components/QuotePreview'
import { useToast } from '../shared/hooks/useToast'
import { useWebShare } from '../shared/hooks/useWebShare'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'
import { generateQuotePdf, revokePdfUrl } from '../shared/utils/pdf'
import { useAuth } from '../providers/AuthProvider'
import { useInvoiceStore } from '../features/invoicing/store'
import type { Invoice } from '../features/invoicing/types'
import type { QuoteStatus, MaterialItem, LaborItem } from '../features/quoting/types'

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
}

const STATUS_BADGE_VARIANTS: Record<QuoteStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  draft: 'gray',
  sent: 'blue',
  accepted: 'green',
  rejected: 'red',
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`
}

interface NextStatus {
  status: QuoteStatus
  label: string
  variant: 'primary' | 'secondary' | 'danger'
}

function getNextStatuses(current: QuoteStatus): NextStatus[] {
  switch (current) {
    case 'draft':
      return [
        { status: 'sent', label: 'Marcar como enviado', variant: 'primary' },
      ]
    case 'sent':
      return [
        { status: 'accepted', label: 'Aceptar', variant: 'primary' },
        { status: 'rejected', label: 'Rechazar', variant: 'danger' },
      ]
    case 'accepted':
    case 'rejected':
      return []
  }
}

export function CotizacionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const quote = useQuoteStore((s) => s.quotes.find((q) => q.id === id))
  const updateQuoteStatus = useQuoteStore((s) => s.updateQuoteStatus)
  const deleteQuote = useQuoteStore((s) => s.deleteQuote)
  const addQuote = useQuoteStore((s) => s.addQuote)

  const invoices = useInvoiceStore((s) => s.invoices)
  const addInvoice = useInvoiceStore((s) => s.addInvoice)
  useEffect(() => {
    if (quote) {
      document.title = `Presupuesto - ${quote.clientName} - #${quote.id.slice(0, 8).toUpperCase()} | ElectroGestor`
    }
  }, [quote])

  const { sharePdf } = useWebShare()
  const { company } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [sharing, setSharing] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  const handlePrint = useCallback(() => {
    if (!quote) return
    const { url } = generateQuotePdf({ quote, companyName: company?.name })
    window.open(url, '_blank')
  }, [quote, company?.name])

  const handleShare = useCallback(async () => {
    if (!quote) return
    setSharing(true)

    try {
      const { blob, url } = generateQuotePdf({ quote, companyName: company?.name })
      const message = `ElectroGestor - Presupuesto COT-${quote.id.slice(0, 8).toUpperCase()} - Total: $${quote.total.toFixed(2)}`
      await sharePdf(blob, `presupuesto-${quote.id.slice(0, 8)}.pdf`, message)
      revokePdfUrl(url)
      addToast('PDF listo. Compartilo desde el visor o adjuntalo en WhatsApp.', 'success')
    } catch (err) {
      console.error('Error al compartir presupuesto:', err)
      addToast('Error al compartir el presupuesto', 'error')
    } finally {
      setSharing(false)
    }
  }, [quote, company?.name, sharePdf, addToast])

  const handleStatusChange = useCallback(
    (newStatus: QuoteStatus) => {
      if (id) {
        updateQuoteStatus(id, newStatus)
        const labels: Record<QuoteStatus, string> = {
          draft: 'Borrador',
          sent: 'Enviado',
          accepted: 'Aceptado',
          rejected: 'Rechazado',
        }
        addToast(`Presupuesto marcado como "${labels[newStatus]}"`, 'success')
      }
    },
    [id, updateQuoteStatus, addToast],
  )

  const handleDuplicate = useCallback(() => {
    if (!quote) return
    const newQuote = {
      ...quote,
      id: crypto.randomUUID(),
      clientName: `${quote.clientName} (Copia)`,
      status: 'draft' as QuoteStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addQuote(newQuote)
    addToast('Presupuesto duplicado como borrador', 'success')
    navigate(`/cotizaciones/${newQuote.id}`)
  }, [quote, addQuote, navigate, addToast])

  const handleGenerateInvoice = useCallback(() => {
    if (!quote) return
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      number: '',
      quoteId: quote.id,
      clientId: quote.clientId || undefined,
      clientName: quote.clientName,
      items: quote.items,
      subtotal: quote.subtotal,
      iva: quote.iva,
      discount: quote.discount,
      total: quote.total,
      status: 'draft',
      notes: quote.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    addInvoice(invoice)
    addToast('Factura generada desde la cotización', 'success')
    navigate(`/facturacion/${invoice.id}`)
  }, [quote, addInvoice, navigate, addToast])

  const handleDelete = useCallback(() => {
    if (!id) return
    deleteQuote(id)
    addToast('Presupuesto eliminado', 'success')
    navigate('/cotizaciones')
  }, [id, deleteQuote, navigate, addToast])

  if (!quote) {
    return (
      <div className="space-y-6">
        <Card padding="lg">
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Presupuesto no encontrado</p>
            <button
              onClick={() => navigate('/cotizaciones')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Volver a cotizaciones
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const existingInvoice = quote.id
    ? invoices.find((inv) => inv.quoteId === quote.id)
    : undefined
  const materials = quote.items.filter(
    (i): i is MaterialItem => i.type === 'material',
  )
  const labors = quote.items.filter(
    (i): i is LaborItem => i.type === 'labor',
  )
  const nextStatuses = getNextStatuses(quote.status)
  const ivaAmount =
    quote.iva != null ? quote.subtotal * (quote.iva / 100) : 0
  const discountAmount =
    quote.discount != null
      ? quote.subtotal * (quote.discount / 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/cotizaciones"
            className="text-sm text-blue-600 hover:text-blue-800 shrink-0"
          >
            &larr; Volver
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white min-w-0 truncate">
            Presupuesto #{quote.id.slice(0, 8).toUpperCase()}
          </h2>
          <Badge variant={STATUS_BADGE_VARIANTS[quote.status]} className="shrink-0">
            {STATUS_LABELS[quote.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isMobile ? (
            <DropdownMenu
              trigger={
                <Button variant="outline" size="sm">
                  Acciones ▾
                </Button>
              }
              items={[
                { label: 'Imprimir PDF', onClick: handlePrint },
                {
                  label: sharing ? 'Compartiendo...' : 'Compartir por WhatsApp',
                  onClick: handleShare,
                },
                {
                  label: 'Editar',
                  href: `/cotizaciones/${quote.id}/editar`,
                },
                { label: 'Duplicar', onClick: handleDuplicate },
                {
                  label: 'Eliminar',
                  onClick: () => setShowDeleteModal(true),
                  danger: true,
                },
              ]}
            />
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                Imprimir PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={sharing}
              >
                {sharing ? 'Compartiendo...' : 'Compartir por WhatsApp'}
              </Button>
              <DropdownMenu
                trigger={
                  <Button variant="outline" size="sm">
                    Acciones ▾
                  </Button>
                }
                items={[
                  {
                    label: 'Editar',
                    href: `/cotizaciones/${quote.id}/editar`,
                  },
                  { label: 'Duplicar', onClick: handleDuplicate },
                  {
                    label: 'Eliminar',
                    onClick: () => setShowDeleteModal(true),
                    danger: true,
                  },
                ]}
              />
            </>
          )}
        </div>
      </div>

      {/* Status change */}
      {nextStatuses.length > 0 && (
        <div className="no-print flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Cambiar estado:
          </span>
          {nextStatuses.map((next) => (
            <Button
              key={next.status}
              variant={next.variant}
              size="sm"
              onClick={() => handleStatusChange(next.status)}
            >
              {next.label}
            </Button>
          ))}
        </div>
      )}

      {/* Generate invoice */}
      {quote.status === 'accepted' && (
        <div className="no-print flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Facturación:
          </span>
          {existingInvoice ? (
            <Button variant="outline" size="sm" disabled>
              Ya facturada
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateInvoice}
            >
              Generar factura
            </Button>
          )}
        </div>
      )}

      <div className="no-print space-y-6">
        {/* Client info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Datos del cliente
            </h3>
          </CardHeader>
          <CardBody>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {quote.clientName}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Creado el {formatDate(quote.createdAt)}
            </p>
            {quote.updatedAt !== quote.createdAt && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última modificación: {formatDate(quote.updatedAt)}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
          </CardHeader>
          <CardBody>
            {materials.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Materiales
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          Cant.
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          Descripción
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          P. Unit
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                      {materials.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200">
                            {item.description}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {labors.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Mano de Obra
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          Hs.
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          Descripción
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          $/h
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                      {labors.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {item.laborHours}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-200">
                            {item.description}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.hourlyRate)}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(
                              item.laborHours * item.hourlyRate,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Totales</h3>
          </CardHeader>
          <CardBody>
            <div className="ml-auto w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.iva != null && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>IVA ({quote.iva}%)</span>
                  <span>{formatCurrency(ivaAmount)}</span>
                </div>
              )}
              {quote.discount != null && quote.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Descuento ({quote.discount}%)</span>
                  <span className="text-red-600">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notes */}
        {quote.notes && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notas</h3>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {quote.notes}
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Preview for print and share */}
      <div className="print-only print-block" ref={previewRef}>
        <QuotePreview quote={quote} />
      </div>

      {/* Delete modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar presupuesto"
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          ¿Estás seguro de que querés eliminar este presupuesto? Esta acción no
          se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
