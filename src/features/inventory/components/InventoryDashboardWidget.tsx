import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../../shared/components/Card'
import { Button } from '../../../shared/components/Button'
import { useInventoryStore } from '../store'

export function InventoryDashboardWidget() {
  const navigate = useNavigate()
  const alertsCount = useInventoryStore((s) => s.getAlertsCount())

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Inventario</p>
            {alertsCount > 0 ? (
              <p className="mt-1 text-3xl font-bold text-orange-600">
                {alertsCount}
              </p>
            ) : (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Stock al día</span>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/inventario')}
          >
            Ver inventario
          </Button>
        </div>
      </CardHeader>
      {alertsCount > 0 && (
        <CardBody>
          <p className="text-sm text-gray-600">
            {alertsCount === 1
              ? '1 producto necesita reposición'
              : `${alertsCount} productos necesitan reposición`}
          </p>
        </CardBody>
      )}
    </Card>
  )
}
