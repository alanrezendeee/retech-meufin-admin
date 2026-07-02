import DashboardPage from '@/pages/DashboardPage'

/**
 * Conteúdo da rota index `/dashboard`.
 * A home não exige permission: é o hub pós-login — bloquear aqui significava
 * "logou e viu acesso negado" pra qualquer grupo sem retechfin.dashboard.
 * O que cada usuário pode fazer é decidido dentro dela (e no menu, via CASL).
 */
export function DashboardIndexRoute() {
  return <DashboardPage />
}
