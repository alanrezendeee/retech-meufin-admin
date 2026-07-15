import type { ReactNode } from 'react'
import { PermissionGuard } from '@/auth/guard/permission-guard'
import ReceitasPage from '@/features/finance/pages/ReceitasPage'
import DespesasPage from '@/features/finance/pages/DespesasPage'
import IncomeSourcesPage from '@/features/finance/pages/IncomeSourcesPage'
import CartoesPage from '@/features/finance/pages/CartoesPage'
import FaturasPage from '@/features/finance/pages/FaturasPage'
import ContasPage from '@/features/finance/pages/ContasPage'
import ContasDoDiaPage from '@/features/finance/pages/ContasDoDiaPage'
import CategoriasPage from '@/features/finance/pages/CategoriasPage'
import FinanceDashboardPage from '@/features/finance/pages/FinanceDashboardPage'
import FornecedoresPage from '@/features/finance/pages/FornecedoresPage'
import CuponsPage from '@/features/finance/pages/CuponsPage'
import ParcelamentosPage from '@/features/finance/pages/ParcelamentosPage'
import FiscalDashboardPage from '@/features/finance/pages/FiscalDashboardPage'

function guarded(subject: string, node: ReactNode): ReactNode {
  return (
    <PermissionGuard required={{ action: 'view', subject }} hasContent>
      {node}
    </PermissionGuard>
  )
}

/**
 * Rotas do módulo Financeiro, montadas como filhas de `/dashboard` em App.tsx.
 * Cada `path` é relativo (sem barra inicial) ao layout de dashboard.
 * Cada elemento é protegido por PermissionGuard com o subject `finance.*` correspondente.
 */
export const financeRoutes: { path: string; element: ReactNode }[] = [
  { path: 'financeiro/receitas', element: guarded('finance.income', <ReceitasPage />) },
  { path: 'financeiro/despesas', element: guarded('finance.expenses', <DespesasPage />) },
  { path: 'financeiro/fontes', element: guarded('finance.sources', <IncomeSourcesPage />) },
  { path: 'financeiro/cartoes', element: guarded('finance.cards', <CartoesPage />) },
  { path: 'financeiro/faturas', element: guarded('finance.invoices', <FaturasPage />) },
  { path: 'financeiro', element: guarded('finance.dashboard', <FinanceDashboardPage />) },
  { path: 'financeiro/contas', element: guarded('finance.accounts', <ContasPage />) },
  { path: 'financeiro/contas-do-dia', element: guarded('finance.payables', <ContasDoDiaPage />) },
  { path: 'financeiro/categorias', element: guarded('finance.categories', <CategoriasPage />) },
  { path: 'financeiro/fornecedores', element: guarded('finance.suppliers', <FornecedoresPage />) },
  { path: 'financeiro/cupons', element: guarded('finance.expenses', <CuponsPage />) },
  { path: 'financeiro/notas-dashboard', element: guarded('finance.fiscal-dashboard', <FiscalDashboardPage />) },
  { path: 'financeiro/parcelamentos', element: guarded('finance.invoices', <ParcelamentosPage />) },
]
