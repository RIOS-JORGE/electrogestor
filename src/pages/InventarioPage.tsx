import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../shared/components/Card'
import { Button } from '../shared/components/Button'
import { InventoryList } from '../features/inventory/components/InventoryList'
import { LowStockAlerts } from '../features/inventory/components/LowStockAlerts'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'

export function InventarioPage() {
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    document.title = 'Inventario | ElectroGestor'
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Inventario
        </h2>
        <Link to="/inventario/nuevo">
          <Button>Nuevo producto</Button>
        </Link>
      </div>

      {/* Low stock alerts */}
      <LowStockAlerts />

      {/* Product list */}
      {isMobile ? (
        <InventoryList />
      ) : (
        <Card padding="lg">
          <InventoryList />
        </Card>
      )}
    </div>
  )
}
