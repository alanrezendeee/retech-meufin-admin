import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import HomeSafetyDashboardPage from '@/features/homesafety/pages/HomeSafetyDashboardPage'
import HomeSafetyItemsPage from '@/features/homesafety/pages/HomeSafetyItemsPage'

function guarded(subject: string, node: ReactNode): ReactNode {
  return (
    <PermissionGuard required={{ action: 'view', subject }} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo Segurança do Lar, montadas como filhas de `/dashboard` em App.tsx.
 */
export const homeSafetyRoutes: { path: string; element: ReactNode }[] = [
  { path: 'seguranca-lar', element: guarded('homesafety.dashboard', <HomeSafetyDashboardPage />) },
  { path: 'seguranca-lar/itens', element: guarded('homesafety.items', <HomeSafetyItemsPage />) },
]
