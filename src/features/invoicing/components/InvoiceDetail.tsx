import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useInvoiceStore } from '../store'
import { Badge } from '../../../shared/components/Badge'
import { Button } from '../../../shared/components/Button'
import { DropdownMenu } from '../../../shared/components/DropdownMenu'
import { Card, CardHeader, CardBody } from '../../../shared/components/Card'
import { Modal } from '../../../shared/components/Modal'
import { useToast } from '../../../shared/hooks/useToast'
import { useWebShare } from '../../../shared/hooks/useWebShare'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import { generatePdfBlob, revokePdfUrl } from '../../../shared/utils/pdf'
import { InvoicePreview } from './InvoicePreview'
import type { Invoice, InvoiceStatus } from '../types'
import type { MaterialItem, LaborItem } from '../../quoting/types'

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

const STATUS_BADGE_VARIANTS: Record<InvoiceStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  draft: 'gray',
  issued: 'blue',
  paid: 'green',
  cancelled: 'red',
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
  status: InvoiceStatus
  label: string
  variant: 'primary' | 'danger'
}

function getNextStatuses(current: InvoiceStatus): NextStatus[] {
  switch (current) {
    case 'draft':
      return [
        { status: 'issued', label: 'Emitir factura', variant: 'primary' },
        { status: 'cancelled', label: 'Cancelar', variant: 'danger' },
      ]
    case 'issued':
      return [
        { status: 'paid', label: 'Marcar como pagada', variant: 'primary' },
        { status: 'cancelled', label: 'Cancelar', variant: 'danger' },
      ]
    case 'paid':
    case 'cancelled':
      return []
  }
}

interface InvoiceDetailProps {
  invoice: Invoice
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const updateInvoiceStatus = useInvoiceStore((s) => s.updateInvoiceStatus)
  const { addToast } = useToast()
  const { sharePdf } = useWebShare()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<InvoiceStatus | null>(null)
  const [sharing, setSharing] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  const materials = invoice.items.filter(
    (i): i is MaterialItem => i.type === 'material',
  )
  const labors = invoice.items.filter(
    (i): i is LaborItem => i.type === 'labor',
  )
  const nextStatuses = getNextStatuses(invoice.status)
  const ivaAmount =
    invoice.iva != null ? invoice.subtotal * (invoice.iva / 100) : 0
  const discountAmount =
    invoice.discount != null
      ? invoice.subtotal * (invoice.discount / 100)
      : 0

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleShare = useCallback(async () => {
    if (!previewRef.current) return
    setSharing(true)
    const el = previewRef.current
    // Temporarily show for capture — force white bg + black text
    // to prevent dark mode from leaking into the PDF capture
    el.style.setProperty('display', 'block', 'important')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    el.style.top = '0'
    el.style.setProperty('background', '#ffffff', 'important')
    el.style.setProperty('color', '#000000', 'important')
    try {
      // Wait one frame for the browser to render the element
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      const { blob, url } = await generatePdfBlob(el)
      const message = `ElectroGestor - Factura ${invoice.number} - Total: $${invoice.total.toFixed(2)}`
      await sharePdf(blob, `factura-${invoice.number}.pdf`, message)
      revokePdfUrl(url)
      addToast('PDF listo. Compartilo desde el visor o adjuntalo en WhatsApp.', 'success')
    } catch (err) {
      console.error('Error al compartir factura:', err)
      addToast('Error al compartir la factura', 'error')
    } finally {
      el.style.display = ''
      el.style.position = ''
      el.style.left = ''
      el.style.top = ''
      el.style.background = ''
      el.style.color = ''
      setSharing(false)
    }
  }, [invoice, sharePdf, addToast])

  const handleStatusChange = useCallback(
    (newStatus: InvoiceStatus) => {
      if (newStatus === 'cancelled') {
        setPendingStatus(newStatus)
        setShowCancelModal(true)
      } else {
        updateInvoiceStatus(invoice.id, newStatus)
        addToast(`Factura marcada como "${STATUS_LABELS[newStatus]}"`, 'success')
      }
    },
    [invoice.id, updateInvoiceStatus, addToast],
  )

  const confirmCancel = useCallback(() => {
    if (pendingStatus) {
      updateInvoiceStatus(invoice.id, pendingStatus)
      addToast(`Factura marcada como "${STATUS_LABELS[pendingStatus]}"`, 'success')
      setPendingStatus(null)
      setShowCancelModal(false)
    }
  }, [invoice.id, pendingStatus, updateInvoiceStatus, addToast])

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/facturacion"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 shrink-0"
          >
            &larr; Volver
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 min-w-0 truncate">
            Factura {invoice.number}
          </h2>
          <Badge variant={STATUS_BADGE_VARIANTS[invoice.status]} className="shrink-0">
            {STATUS_LABELS[invoice.status]}
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
            </>
          )}
        </div>
      </div>

      {/* Status change */}
      {nextStatuses.length > 0 && (
        <div className="no-print flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
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

      <div className="no-print space-y-6">
        {/* Invoice header */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Datos de la factura
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Número
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {invoice.number}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Fecha de creación
                </p>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              {invoice.issuedAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Fecha de emisión
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(invoice.issuedAt)}
                  </p>
                </div>
              )}
              {invoice.dueDate && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Vencimiento
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
              )}
              {invoice.paidAt && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Fecha de pago
                  </p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Source quote link */}
        {invoice.quoteId && (
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ver cotización origen:{' '}
                <Link
                  to={`/cotizaciones/${invoice.quoteId}`}
                  className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  #{invoice.quoteId.slice(0, 8).toUpperCase()}
                </Link>
              </p>
            </CardBody>
          </Card>
        )}

        {/* Client info */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Datos del cliente
            </h3>
          </CardHeader>
          <CardBody>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">
              {invoice.clientName}
            </p>
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Items</h3>
          </CardHeader>
          <CardBody>
            {materials.length > 0 && (
              <div className="mb-6">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Materiales
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Cant.
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Descripción
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          P. Unit
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {materials.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50">
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                            {item.description}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
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
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Hs.
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Descripción
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          $/h
                        </th>
                        <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {labors.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800/50">
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {item.laborHours}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                            {item.description}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(item.hourlyRate)}
                          </td>
                          <td className="whitespace-nowrap px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Totales</h3>
          </CardHeader>
          <CardBody>
            <div className="ml-auto w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.iva != null && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>IVA ({invoice.iva}%)</span>
                  <span>{formatCurrency(ivaAmount)}</span>
                </div>
              )}
              {invoice.discount != null && invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Descuento ({invoice.discount}%)</span>
                  <span className="text-red-600 dark:text-red-400">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 text-lg font-bold text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notas</h3>
            </CardHeader>
            <CardBody>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {invoice.notes}
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Preview for print and share */}
      <div className="print-only print-block" ref={previewRef}>
        <InvoicePreview invoice={invoice} />
      </div>

      {/* Cancel confirmation modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setPendingStatus(null)
        }}
        title="Cancelar factura"
        size="sm"
      >
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          ¿Estás seguro de que querés cancelar esta factura? Esta acción no se
          puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowCancelModal(false)
              setPendingStatus(null)
            }}
          >
            Volver
          </Button>
          <Button variant="danger" onClick={confirmCancel}>
            Cancelar factura
          </Button>
        </div>
      </Modal>
    </div>
  )
}
