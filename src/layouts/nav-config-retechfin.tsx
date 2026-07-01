import type { NavDataSection } from '@/layouts/components/nav-filter-by-casl'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import FolderSharedRoundedIcon from '@mui/icons-material/FolderSharedRounded'

/**
 * Menu RetechFin Admin — subjects alinhados ao manifest / abilities da API de auth (retechauth-api).
 * Exemplo de uso com CASL: <Can I="view" a="Menu:Dashboard" /> ou subjects `retechfin.*`.
 */
export const retechfinNavSections: NavDataSection[] = [
  {
    subheader: 'Menu',
    items: [
      {
        label: 'Painel',
        path: '/dashboard',
        icon: DashboardRoundedIcon,
        permission: { action: 'view', subject: 'retechfin.dashboard' },
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
