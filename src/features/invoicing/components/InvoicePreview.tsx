import type { Invoice } from '../types'
import type { MaterialItem, LaborItem } from '../../quoting/types'

interface InvoicePreviewProps {
  invoice: Invoice
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

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const materials = invoice.items.filter(
    (i): i is MaterialItem => i.type === 'material',
  )
  const labors = invoice.items.filter(
    (i): i is LaborItem => i.type === 'labor',
  )
  const subtotal = invoice.subtotal
  const ivaAmount = invoice.iva != null ? subtotal * (invoice.iva / 100) : 0
  const discountAmount =
    invoice.discount != null ? subtotal * (invoice.discount / 100) : 0

  return (
    <div className="print-container mx-auto max-w-4xl bg-white p-8 print:m-0 print:p-6">
      {/* Company header */}
      <div className="border-b border-gray-300 pb-6 print:border-gray-400">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 print:text-black">
              ElectroGestor
            </h1>
            <p className="mt-1 text-sm text-gray-500 print:text-gray-700">
              Soluciones eléctricas profesionales
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900 print:text-black">
              FACTURA
            </p>
            <p className="text-sm text-gray-500 print:text-gray-700">
              {invoice.number}
            </p>
            <p className="text-sm text-gray-500 print:text-gray-700">
              {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice dates row */}
      <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-600 print:text-gray-700">
        {invoice.issuedAt && (
          <p>
            <span className="font-medium">Fecha de emisión:</span>{' '}
            {formatDate(invoice.issuedAt)}
          </p>
        )}
        {invoice.dueDate && (
          <p>
            <span className="font-medium">Vencimiento:</span>{' '}
            {formatDate(invoice.dueDate)}
          </p>
        )}
        {invoice.paidAt && (
          <p>
            <span className="font-medium">Fecha de pago:</span>{' '}
            {formatDate(invoice.paidAt)}
          </p>
        )}
      </div>

      {/* Client info */}
      <div className="mt-6 border-b border-gray-200 pb-6 print:border-gray-300">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 print:text-gray-700">
          Cliente
        </h2>
        <p className="text-base font-medium text-gray-900 print:text-black">
          {invoice.clientName}
        </p>
      </div>

      {/* Items table */}
      <div className="mt-6">
        {materials.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 print:text-gray-700">
              Materiales
            </h3>
            <table className="quote-items w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 print:border-gray-400">
                  <th className="py-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Cant.
                  </th>
                  <th className="py-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Descripción
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    P. Unit
                  </th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 print:border-gray-200"
                  >
                    <td className="py-3 pr-4 text-sm text-gray-700 print:text-black">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-900 print:text-black">
                      {item.description}
                    </td>
                    <td className="py-3 pr-4 text-right text-sm text-gray-700 print:text-black">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right text-sm text-gray-900 print:text-black">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {labors.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 print:text-gray-700">
              Mano de Obra
            </h3>
            <table className="quote-items w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 print:border-gray-400">
                  <th className="py-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Hs.
                  </th>
                  <th className="py-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Descripción
                  </th>
                  <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    $/h
                  </th>
                  <th className="py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500 print:text-gray-700">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {labors.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 print:border-gray-200"
                  >
                    <td className="py-3 pr-4 text-sm text-gray-700 print:text-black">
                      {item.laborHours}
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-900 print:text-black">
                      {item.description}
                    </td>
                    <td className="py-3 pr-4 text-right text-sm text-gray-700 print:text-black">
                      {formatCurrency(item.hourlyRate)}
                    </td>
                    <td className="py-3 text-right text-sm text-gray-900 print:text-black">
                      {formatCurrency(item.laborHours * item.hourlyRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="mt-6 border-t border-gray-300 pt-4 print:border-gray-400">
        <div className="ml-auto w-72 space-y-2">
          <div className="flex justify-between text-sm text-gray-600 print:text-gray-700">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {invoice.iva != null && (
            <div className="flex justify-between text-sm text-gray-600 print:text-gray-700">
              <span>IVA ({invoice.iva}%)</span>
              <span>{formatCurrency(ivaAmount)}</span>
            </div>
          )}
          {invoice.discount != null && invoice.discount > 0 && (
            <div className="flex justify-between text-sm text-gray-600 print:text-gray-700">
              <span>Descuento ({invoice.discount}%)</span>
              <span className="text-red-600 print:text-red-700">
                -{formatCurrency(discountAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-2 text-lg font-bold text-gray-900 print:border-gray-400 print:text-black">
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6 border-t border-gray-200 pt-4 print:border-gray-300">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 print:text-gray-700">
            Notas
          </h3>
          <p className="whitespace-pre-wrap text-sm text-gray-700 print:text-black">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400 print:border-gray-300 print:text-gray-600">
        <p>ElectroGestor — Soluciones eléctricas profesionales</p>
        <p className="mt-1">Gracias por confiar en nosotros.</p>
      </div>
    </div>
  )
}
