import type { NavDataSection } from '@/layouts/components/nav-filter-by-casl'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
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
import GarageRoundedIcon from '@mui/icons-material/GarageRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded'
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded'
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded'
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded'
import HomeRepairServiceRoundedIcon from '@mui/icons-material/HomeRepairServiceRounded'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'

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
        label: 'Notas & Preços',
        path: '/dashboard/financeiro/notas-dashboard',
        icon: QueryStatsRoundedIcon,
        permission: { action: 'view', subject: 'finance.fiscal-dashboard' },
        info: 'finance.fiscal-dashboard',
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
    subheader: 'Frota Familiar',
    items: [
      {
        label: 'Dashboard Frota',
        path: '/dashboard/frota',
        icon: GarageRoundedIcon,
        permission: { action: 'view', subject: 'vehicles.dashboard' },
      },
      {
        label: 'Veículos',
        path: '/dashboard/frota/veiculos',
        icon: DirectionsCarRoundedIcon,
        permission: { action: 'view', subject: 'vehicles.list' },
      },
    ],
  },
  {
    subheader: 'Patrimônio',
    items: [
      {
        label: 'Dashboard Patrimônio',
        path: '/dashboard/patrimonio',
        icon: HomeWorkRoundedIcon,
        permission: { action: 'view', subject: 'patrimony.dashboard' },
      },
      {
        label: 'Imóveis',
        path: '/dashboard/patrimonio/imoveis',
        icon: HomeWorkRoundedIcon,
        permission: { action: 'view', subject: 'patrimony.properties' },
      },
      {
        label: 'Impostos de Bens',
        path: '/dashboard/patrimonio/impostos',
        icon: RequestQuoteRoundedIcon,
        permission: { action: 'view', subject: 'patrimony.taxes' },
      },
      {
        label: 'Garantias',
        path: '/dashboard/garantias',
        icon: VerifiedUserRoundedIcon,
        permission: { action: 'view', subject: 'warranties.list' },
      },
    ],
  },
  {
    subheader: 'Educação',
    items: [
      {
        label: 'Dashboard Educação',
        path: '/dashboard/educacao',
        icon: SchoolRoundedIcon,
        permission: { action: 'view', subject: 'education.dashboard' },
      },
      {
        label: 'Matrículas',
        path: '/dashboard/educacao/matriculas',
        icon: SchoolRoundedIcon,
        permission: { action: 'view', subject: 'education.enrollments' },
      },
      {
        label: 'Listas de Material',
        path: '/dashboard/educacao/listas',
        icon: ListAltRoundedIcon,
        permission: { action: 'view', subject: 'education.lists' },
      },
    ],
  },
  {
    subheader: 'Segurança do Lar',
    items: [
      {
        label: 'Painel de Segurança',
        path: '/dashboard/seguranca-lar',
        icon: ShieldRoundedIcon,
        permission: { action: 'view', subject: 'homesafety.dashboard' },
      },
      {
        label: 'Itens de Segurança',
        path: '/dashboard/seguranca-lar/itens',
        icon: HomeRepairServiceRoundedIcon,
        permission: { action: 'view', subject: 'homesafety.items' },
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
