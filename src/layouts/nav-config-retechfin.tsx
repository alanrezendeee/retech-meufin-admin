import type { NavDataSection } from '@/layouts/components/nav-filter-by-casl'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import FolderSharedRoundedIcon from '@mui/icons-material/FolderSharedRounded'
import GroupRoundedIcon from '@mui/icons-material/GroupRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'

/**
 * Menu RetechFin Admin — subjects alinhados ao manifest / abilities da API de auth (retechauth-api).
 * Exemplo de uso com CASL: <Can I="view" a="Menu:Dashboard" /> ou subjects `retechfin.*`.
 */
export const retechfinNavSections: NavDataSection[] = [
  {
    subheader: 'Menu',
    items: [
      {
        // Home é o hub pós-login: visível pra qualquer autenticado (rota idem).
        label: 'Painel',
        path: '/dashboard',
        icon: DashboardRoundedIcon,
      },
      {
        label: 'Transações',
        path: '/dashboard/transacoes',
        icon: ReceiptLongRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'retechfin.transactions' },
      },
      {
        label: 'Categorias',
        path: '/dashboard/categorias',
        icon: CategoryRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'retechfin.categories' },
      },
      {
        label: 'Contas',
        path: '/dashboard/contas',
        icon: AccountBalanceRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'retechfin.accounts' },
      },
      {
        label: 'Cartões',
        path: '/dashboard/cartoes',
        icon: CreditCardRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'retechfin.cards' },
      },
      {
        label: 'Metas',
        path: '/dashboard/metas',
        icon: FlagRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'retechfin.goals' },
      },
    ],
  },
  {
    subheader: 'Financeiro',
    items: [
      {
        label: 'Dashboard Financeira',
        path: '/dashboard/financeiro',
        icon: InsightsRoundedIcon,
        permission: { action: 'view', subject: 'finance.dashboard' },
        info: 'finance.dashboard',
      },
      {
        label: 'Contas do Dia',
        path: '/dashboard/financeiro/contas-do-dia',
        icon: TaskAltRoundedIcon,
        permission: { action: 'view', subject: 'finance.payables' },
        info: 'finance.payables',
      },
      {
        label: 'Receitas',
        path: '/dashboard/financeiro/receitas',
        icon: PaymentsRoundedIcon,
        permission: { action: 'view', subject: 'finance.income' },
        info: 'finance.income',
      },
      {
        label: 'Despesas',
        path: '/dashboard/financeiro/despesas',
        icon: TrendingDownRoundedIcon,
        permission: { action: 'view', subject: 'finance.expenses' },
        info: 'finance.expenses',
      },
      {
        label: 'Categorias',
        path: '/dashboard/financeiro/categorias',
        icon: CategoryRoundedIcon,
        permission: { action: 'view', subject: 'finance.categories' },
        info: 'finance.categories',
      },
      {
        label: 'Fontes de Receita',
        path: '/dashboard/financeiro/fontes',
        icon: AccountBalanceWalletRoundedIcon,
        permission: { action: 'view', subject: 'finance.sources' },
      },
      {
        label: 'Cartões',
        path: '/dashboard/financeiro/cartoes',
        icon: CreditCardRoundedIcon,
        permission: { action: 'view', subject: 'finance.cards' },
      },
      {
        label: 'Faturas',
        path: '/dashboard/financeiro/faturas',
        icon: ReceiptLongRoundedIcon,
        permission: { action: 'view', subject: 'finance.invoices' },
        info: 'finance.invoices',
      },
      {
        label: 'Parcelamentos',
        path: '/dashboard/financeiro/parcelamentos',
        icon: TimelineRoundedIcon,
        permission: { action: 'view', subject: 'finance.invoices' },
      },
      {
        label: 'Cupons e Notas',
        path: '/dashboard/financeiro/cupons',
        icon: ReceiptRoundedIcon,
        permission: { action: 'view', subject: 'finance.expenses' },
      },
      {
        label: 'Contas',
        path: '/dashboard/financeiro/contas',
        icon: AccountBalanceRoundedIcon,
        permission: { action: 'view', subject: 'finance.accounts' },
      },
      {
        label: 'Fornecedores',
        path: '/dashboard/financeiro/fornecedores',
        icon: StorefrontRoundedIcon,
        permission: { action: 'view', subject: 'finance.suppliers' },
      },
    ],
  },
  {
    subheader: 'Saúde Familiar',
    items: [
      {
        label: 'Dashboard Saúde',
        path: '/dashboard/saude',
        icon: MonitorHeartRoundedIcon,
        permission: { action: 'view', subject: 'health.dashboard' },
      },
      {
        label: 'Membros da Família',
        path: '/dashboard/saude/membros',
        icon: GroupsRoundedIcon,
        permission: { action: 'view', subject: 'health.family_members' },
      },
      {
        label: 'Laboratórios',
        path: '/dashboard/saude/laboratorios',
        icon: ScienceRoundedIcon,
        permission: { action: 'view', subject: 'health.labs' },
      },
      {
        label: 'Exames (catálogo)',
        path: '/dashboard/saude/exames',
        icon: BiotechRoundedIcon,
        permission: { action: 'view', subject: 'health.markers' },
        info: 'health.markers',
      },
      {
        label: 'Resultados',
        path: '/dashboard/saude/resultados',
        icon: DescriptionRoundedIcon,
        permission: { action: 'view', subject: 'health.results' },
        info: 'health.results',
      },
      {
        label: 'Documentos',
        path: '/dashboard/saude/documentos',
        icon: FolderSharedRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'health.documents' },
      },
    ],
  },
  {
    subheader: 'Administração',
    items: [
      {
        label: 'Usuários',
        path: '/dashboard/admin/usuarios',
        icon: GroupRoundedIcon,
        permission: { action: 'view', subject: 'admin.users' },
      },
      {
        label: 'Permissões & Grupos',
        path: '/dashboard/admin/permissoes',
        icon: AdminPanelSettingsRoundedIcon,
        permission: { action: 'view', subject: 'admin.roles' },
      },
    ],
  },
  {
    items: [
      {
        label: 'Configurações',
        path: '/dashboard/configuracoes',
        icon: SettingsRoundedIcon,
        soon: true,
        permission: { action: 'view', subject: 'retechfin.settings' },
      },
    ],
  },
]
