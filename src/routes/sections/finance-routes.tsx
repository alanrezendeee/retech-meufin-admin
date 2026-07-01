import type { ReactNode } from 'react'
import ReceitasPage from '@/features/finance/pages/ReceitasPage'
import DespesasPage from '@/features/finance/pages/DespesasPage'
import IncomeSourcesPage from '@/features/finance/pages/IncomeSourcesPage'

/**
 * Rotas do módulo Financeiro, montadas como filhas de `/dashboard` em App.tsx.
 * Cada `path` é relativo (sem barra inicial) ao layout de dashboard.
 *
 * As telas de Financeiro são navegáveis por padrão (sem PermissionGuard), espelhando
 * a decisão de deixar os itens do menu sempre visíveis. Caso as abilities
 * `retechfin.income` / `retechfin.income_sources` passem a existir no manifest de auth,
 * basta envolver os elementos com <PermissionGuard required={{ action: 'view', subject }} />.
 */
export const financeRoutes: { path: string; element: ReactNode }[] = [
  { path: 'financeiro/receitas', element: <ReceitasPage /> },
  { path: 'financeiro/despesas', element: <DespesasPage /> },
  { path: 'financeiro/fontes', element: <IncomeSourcesPage /> },
]
