import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import EducationDashboardPage from '@/features/education/pages/EducationDashboardPage'
import EnrollmentsPage from '@/features/education/pages/EnrollmentsPage'
import SupplyListsPage from '@/features/education/pages/SupplyListsPage'

function guarded(subject: string, node: ReactNode): ReactNode {
  return (
    <PermissionGuard required={{ action: 'view', subject }} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo Educação / Material Escolar, montadas como filhas de
 * `/dashboard` em App.tsx.
 */
export const educationRoutes: { path: string; element: ReactNode }[] = [
  { path: 'educacao', element: guarded('education.dashboard', <EducationDashboardPage />) },
  { path: 'educacao/matriculas', element: guarded('education.enrollments', <EnrollmentsPage />) },
  { path: 'educacao/listas', element: guarded('education.lists', <SupplyListsPage />) },
]
