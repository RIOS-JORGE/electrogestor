import { useSettingsStore } from '../../features/settings/store'

interface PaymentInfoSectionProps {
  total: number
}

export function PaymentInfoSection({ total }: PaymentInfoSectionProps) {
  const mpAlias = useSettingsStore((s) => s.mpAlias)
  const businessName = useSettingsStore((s) => s.businessName)

  if (!mpAlias) return null

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
