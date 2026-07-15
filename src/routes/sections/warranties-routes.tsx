import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import WarrantiesPage from '@/features/warranties/pages/WarrantiesPage'

function guarded(subject: string, node: ReactNode): ReactNode {
  return (
    <PermissionGuard required={{ action: 'view', subject }} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo Garantias de bens, montadas como filhas de `/dashboard` em App.tsx.
 */
export const warrantyRoutes: { path: string; element: ReactNode }[] = [
  { path: 'garantias', element: guarded('warranties.list', <WarrantiesPage />) },
]
