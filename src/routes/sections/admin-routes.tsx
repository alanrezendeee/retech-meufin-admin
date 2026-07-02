import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import UsersPage from '@/features/admin/pages/UsersPage'
import RolesPermissionsPage from '@/features/admin/pages/RolesPermissionsPage'

function guarded(subjects: string | string[], node: ReactNode): ReactNode {
  const list = Array.isArray(subjects) ? subjects : [subjects]
  return (
    <PermissionGuard required={list.map((subject) => ({ action: 'view', subject }))} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo de Administração (IAM), montadas como filhas de `/dashboard`
 * em App.tsx. Consomem a retechauth-api (VITE_AUTH_BASE_URL).
 */
export const adminRoutes: { path: string; element: ReactNode }[] = [
  { path: 'admin/usuarios', element: guarded('admin.users', <UsersPage />) },
  // ANY-of: quem gerencia grupos OU quem gerencia o catálogo de permissões entra
  { path: 'admin/permissoes', element: guarded(['admin.roles', 'admin.permissions'], <RolesPermissionsPage />) },
]
