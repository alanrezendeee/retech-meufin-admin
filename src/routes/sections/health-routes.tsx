import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import HealthDashboardPage from '@/features/health/pages/HealthDashboardPage'
import FamilyMembersPage from '@/features/health/pages/FamilyMembersPage'
import LabsPage from '@/features/health/pages/LabsPage'
import MarkersPage from '@/features/health/pages/MarkersPage'
import ExamResultsPage from '@/features/health/pages/ExamResultsPage'
import AppointmentsPage from '@/features/health/pages/AppointmentsPage'
import HealthPlansPage from '@/features/health/pages/HealthPlansPage'

function guarded(subject: string, node: ReactNode): ReactNode {
  return (
    <PermissionGuard required={{ action: 'view', subject }} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo Saúde Familiar, montadas como filhas de `/dashboard` em App.tsx.
 * Cada `path` é relativo (sem barra inicial) ao layout de dashboard.
 */
export const healthRoutes: { path: string; element: ReactNode }[] = [
  { path: 'saude', element: guarded('health.dashboard', <HealthDashboardPage />) },
  { path: 'saude/membros', element: guarded('health.family_members', <FamilyMembersPage />) },
  { path: 'saude/laboratorios', element: guarded('health.labs', <LabsPage />) },
  { path: 'saude/consultas', element: guarded('health.appointments', <AppointmentsPage />) },
  { path: 'saude/planos', element: guarded('health.plans', <HealthPlansPage />) },
  { path: 'saude/exames', element: guarded('health.markers', <MarkersPage />) },
  { path: 'saude/resultados', element: guarded('health.results', <ExamResultsPage />) },
]
