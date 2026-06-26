import type { Invoice } from '../types'
import type { MaterialItem, LaborItem } from '../../quoting/types'
import { PaymentInfoSection } from '../../../shared/components/PaymentInfoSection'

interface InvoicePreviewProps {
  invoice: Invoice
  companyName?: string
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

export function InvoicePreview({ invoice, companyName }: InvoicePreviewProps) {
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
    <div className="print-container bg-white p-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER — Company + Invoice info side by side */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between pb-4" style={{ borderBottom: '2px solid #1e40af' }}>
        <div>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
            {companyName || 'ElectroGestor'}
          </h1>
          <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
            Soluciones eléctricas profesionales
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', margin: 0, letterSpacing: '2px' }}>
            FACTURA
          </p>
          <p style={{ fontSize: '11px', color: '#374151', marginTop: '4px', fontWeight: '600' }}>
            {invoice.number}
          </p>
          <p style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
            {formatDate(invoice.createdAt)}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* DATES ROW */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1" style={{ fontSize: '10px', color: '#4b5563' }}>
        {invoice.issuedAt && (
          <p style={{ margin: 0 }}>
            <strong>Fecha de emisión:</strong> {formatDate(invoice.issuedAt)}
          </p>
        )}
        {invoice.dueDate && (
          <p style={{ margin: 0 }}>
            <strong>Vencimiento:</strong> {formatDate(invoice.dueDate)}
          </p>
        )}
        {invoice.paidAt && (
          <p style={{ margin: 0 }}>
            <strong>Fecha de pago:</strong> {formatDate(invoice.paidAt)}
          </p>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CLIENT */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mt-4 pb-3" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', margin: '0 0 3px' }}>
          Cliente
        </p>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#111827', margin: 0 }}>
          {invoice.clientName}
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ITEMS TABLES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mt-4">
        {materials.length > 0 && (
          <div className="mb-6">
            <p style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '6px' }}>
              Materiales
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={thStyle}>Cant.</th>
                  <th style={{ ...thStyle, width: '45%' }}>Descripción</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>P. Unit</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>{item.quantity} {item.unit}</td>
                    <td style={tdStyle}>{item.description}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', fontFamily: 'monospace' }}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {labors.length > 0 && (
          <div className="mb-6">
            <p style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '6px' }}>
              Mano de Obra
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={thStyle}>Hs.</th>
                  <th style={{ ...thStyle, width: '45%' }}>Descripción</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>$/h</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {labors.map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={tdStyle}>{item.laborHours}</td>
                    <td style={tdStyle}>{item.description}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(item.hourlyRate)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: '600', fontFamily: 'monospace' }}>{formatCurrency(item.laborHours * item.hourlyRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TOTALS */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mt-4 pt-3" style={{ borderTop: '2px solid #1e40af' }}>
        <div style={{ marginLeft: 'auto', width: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', padding: '3px 0' }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: 'monospace' }}>{formatCurrency(subtotal)}</span>
          </div>
          {invoice.iva != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#4b5563', padding: '3px 0' }}>
              <span>IVA ({invoice.iva}%)</span>
              <span style={{ fontFamily: 'monospace' }}>{formatCurrency(ivaAmount)}</span>
            </div>
          )}
          {invoice.discount != null && invoice.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#dc2626', padding: '3px 0' }}>
              <span>Descuento ({invoice.discount}%)</span>
              <span style={{ fontFamily: 'monospace' }}>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #111827', paddingTop: '6px', marginTop: '2px', fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>
            <span>Total</span>
            <span style={{ fontFamily: 'monospace' }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PAYMENT INFO */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mt-6">
        <PaymentInfoSection total={invoice.total} plain />
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* NOTES */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {invoice.notes && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '9px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '4px' }}>
            Notas
          </p>
          <p style={{ fontSize: '10px', color: '#374151', margin: 0, whiteSpace: 'pre-wrap' }}>
            {invoice.notes}
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <div className="mt-6 pt-3" style={{ borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ fontSize: '9px', color: '#9ca3af', margin: 0 }}>
          {companyName || 'ElectroGestor'} — Soluciones eléctricas profesionales
        </p>
        <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>
          Gracias por confiar en nosotros.
        </p>
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: '9px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#374151',
  textAlign: 'left',
  borderBottom: '2px solid #d1d5db',
}

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: '10px',
  color: '#374151',
  textAlign: 'left',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
}
