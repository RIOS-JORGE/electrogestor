import { useSettingsStore } from '../../features/settings/store'

interface PaymentInfoSectionProps {
  total: number
  /** Render with inline styles for PDF capture (avoids dark mode bleed) */
  plain?: boolean
}

export function PaymentInfoSection({ total, plain }: PaymentInfoSectionProps) {
  const mpAlias = useSettingsStore((s) => s.mpAlias)
  const businessName = useSettingsStore((s) => s.businessName)

  if (!mpAlias) return null

  if (plain) {
    return (
      <div style={{ marginTop: '16px', borderRadius: '6px', border: '1px solid #bfdbfe', background: '#eff6ff', padding: '12px', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <p style={{ fontSize: '11px', fontWeight: '600', color: '#1e40af', margin: 0 }}>
          Datos de pago
        </p>
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#1d4ed8' }}>
          {businessName && (
            <p style={{ margin: '3px 0' }}>
              <strong>Negocio:</strong> {businessName}
            </p>
          )}
          <p style={{ margin: '3px 0' }}>
            <strong>Alias MP:</strong> {mpAlias}
          </p>
          <p style={{ margin: '3px 0' }}>
            <strong>Total a transferir:</strong> ${total.toFixed(2)}
          </p>
          <p style={{ marginTop: '6px', fontSize: '9px', color: '#2563eb' }}>
            Transferí el monto total a Mercado Pago usando el alias.
            Una vez realizada la transferencia, marcá la factura como pagada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
        Datos de pago
      </h3>
      <div className="mt-3 space-y-2 text-sm text-blue-700 dark:text-blue-200">
        {businessName && (
          <p>
            <span className="font-medium">Negocio:</span> {businessName}
          </p>
        )}
        <p>
          <span className="font-medium">Alias MP:</span> {mpAlias}
        </p>
        <p>
          <span className="font-medium">Total a transferir:</span> $
          {total.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
          Transferí el monto total a Mercado Pago usando el alias.
          Una vez realizada la transferencia, marcá la factura como pagada.
        </p>
      </div>
    </div>
  )
}
