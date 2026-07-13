import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import VehiclesDashboardPage from '@/features/vehicles/pages/VehiclesDashboardPage'
import VehiclesPage from '@/features/vehicles/pages/VehiclesPage'
import VehicleDetailPage from '@/features/vehicles/pages/VehicleDetailPage'

function guarded(subject: string, node: ReactNode): ReactNode {
  return (
    <PermissionGuard required={{ action: 'view', subject }} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo Frota Familiar, montadas como filhas de `/dashboard` em App.tsx.
 */
export const vehicleRoutes: { path: string; element: ReactNode }[] = [
  { path: 'frota', element: guarded('vehicles.dashboard', <VehiclesDashboardPage />) },
  { path: 'frota/veiculos', element: guarded('vehicles.list', <VehiclesPage />) },
  { path: 'frota/veiculos/:vehicleId', element: guarded('vehicles.detail', <VehicleDetailPage />) },
]
