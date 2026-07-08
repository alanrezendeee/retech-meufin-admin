import { useState, type ReactNode } from 'react'
import {
  alpha,
  Box,
  ButtonBase,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { AppLogo } from './AppLogo'
import { SidebarUserCard } from './SidebarUserCard'
import { MenuInfoPopover } from './MenuInfoPopover'
import { lp } from '@/theme/tokens'
import { retechfinNavSections } from '@/layouts/nav-config-retechfin'
import { useFilteredNavData, type NavDataItem } from '@/layouts/components/nav-filter-by-casl'

/** Padding horizontal do conteúdo; à direita um pouco maior para o logo não colar na borda */
const drawerPaddingX = { pl: 0.5, pr: 3.5 } as const

/** Scrollbar temática (reflete no tema atual — dark/light + template). */
const scrollSx = (theme: import('@mui/material').Theme) => ({
  flex: 1,
  overflowY: 'auto' as const,
  overflowX: 'hidden' as const,
  minHeight: 0,
  scrollbarWidth: 'thin' as const,
  scrollbarColor: `${alpha(theme.palette.primary.main, 0.35)} transparent`,
  '&::-webkit-scrollbar': { width: 6 },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.primary.main, 0.28),
    borderRadius: 8,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.5),
  },
})

/** Flyout no hover (rail recolhida) para itens com submenu: mostra todas as opções. */
function CollapsedFlyout({
  label,
  item,
  onNavigate,
  children,
}: {
  label: string
  item: NavDataItem
  onNavigate?: () => void
  children: ReactNode
}) {
  const { pathname } = useLocation()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  return (
    <Box onMouseEnter={(e) => setAnchorEl(e.currentTarget)} onMouseLeave={() => setAnchorEl(null)}>
      {children}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{ pointerEvents: 'none' }}
        slotProps={{ paper: { sx: { pointerEvents: 'auto', ml: 1, minWidth: 210, p: 1, borderRadius: 2 } } }}
        disableRestoreFocus
      >
        <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', fontWeight: 700 }}>
          {label}
        </Typography>
        <List disablePadding>
          {(item.children ?? []).map((child) => {
            const ChildIcon = child.icon
            return (
              <ListItemButton
                key={child.path}
                {...(!child.soon ? { component: RouterLink, to: child.path } : {})}
                selected={!child.soon && pathname === child.path}
                disabled={child.soon}
                onClick={child.soon ? undefined : onNavigate}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ChildIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={child.label} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            )
          })}
        </List>
      </Popover>
    </Box>
  )
}

const NAV_COLLAPSED_KEY = 'meufin-nav-collapsed-sections'

function loadCollapsedSections(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(NAV_COLLAPSED_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function SidebarNav({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { pathname } = useLocation()
  const sections = useFilteredNavData(retechfinNavSections)

  // Seções fechadas pelo usuário (persistem entre sessões).
  const [closedSections, setClosedSections] = useState<Record<string, boolean>>(loadCollapsedSections)
  const toggleSection = (key: string) =>
    setClosedSections((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(NAV_COLLAPSED_KEY, JSON.stringify(next))
      } catch {
        /* storage indisponível: estado vive só na sessão */
      }
      return next
    })

  const renderExpandedItem = (item: NavDataItem) => {
    const { path, label, icon: Icon, soon } = item
    const selected = !soon && pathname === path

    const button = (
      <ListItemButton
        {...(!soon ? { component: RouterLink, to: path } : {})}
        selected={selected}
        disabled={soon}
        onClick={soon ? undefined : onNavigate}
        sx={{ py: 1.1, opacity: soon ? 0.55 : 1 }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: selected ? 'primary.main' : 'text.secondary' }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ variant: 'body2', fontWeight: selected ? 700 : 500 }}
        />
        {soon && !item.info && (
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
            breve
          </Typography>
        )}
        {item.info && <Box sx={{ width: 28, flexShrink: 0 }} />}
      </ListItemButton>
    )

    const inner = soon ? (
      <Tooltip title="Módulo em desenvolvimento" placement="right">
        <span>{button}</span>
      </Tooltip>
    ) : (
      button
    )

    return (
      <ListItem key={path} disablePadding sx={{ display: 'block' }}>
        <Box sx={{ position: 'relative' }}>
          {inner}
          {item.info && (
            <Box sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
              <MenuInfoPopover ruleKey={item.info} />
            </Box>
          )}
        </Box>
      </ListItem>
    )
  }

  const renderCollapsedItem = (item: NavDataItem) => {
    const { path, label, icon: Icon, soon } = item
    const selected = !soon && pathname === path
    const hasChildren = !!item.children?.length

    const iconButton = (
      <ListItemButton
        {...(!soon && !hasChildren ? { component: RouterLink, to: path } : {})}
        selected={selected}
        disabled={soon}
        onClick={soon ? undefined : onNavigate}
        sx={{
          justifyContent: 'center',
          py: 1.2,
          mx: 0.75,
          borderRadius: 2,
          opacity: soon ? 0.55 : 1,
        }}
      >
        <ListItemIcon sx={{ minWidth: 0, color: selected ? 'primary.main' : 'text.secondary' }}>
          <Icon fontSize="small" />
        </ListItemIcon>
      </ListItemButton>
    )

    if (hasChildren) {
      return (
        <ListItem key={path} disablePadding sx={{ display: 'block' }}>
          <CollapsedFlyout label={label} item={item} onNavigate={onNavigate}>
            {iconButton}
          </CollapsedFlyout>
        </ListItem>
      )
    }

    return (
      <ListItem key={path} disablePadding sx={{ display: 'block' }}>
        <Tooltip title={soon ? `${label} (em breve)` : label} placement="right">
          <span>{iconButton}</span>
        </Tooltip>
      </ListItem>
    )
  }

  const renderItem = collapsed ? renderCollapsedItem : renderExpandedItem

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: 2.5,
        ...(collapsed ? { px: 0 } : { ...drawerPaddingX, pl: 3.5 }),
      }}
    >
      <Box
        component={RouterLink}
        to="/dashboard"
        onClick={onNavigate}
        sx={{
          textDecoration: 'none',
          color: 'inherit',
          mb: 1,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <AppLogo compact={collapsed} />
      </Box>

      {!collapsed && <SidebarUserCard />}

      <Box sx={scrollSx}>
        {sections.map((section, i) => {
          const sectionKey = section.subheader ?? `section-${i}`
          const isClosed = Boolean(section.subheader && closedSections[sectionKey])
          const activeInside = section.items.some((item) => !item.soon && pathname === item.path)
          return (
          <Box key={sectionKey}>
            {!collapsed && section.subheader && (
              <ButtonBase
                onClick={() => toggleSection(sectionKey)}
                aria-expanded={!isClosed}
                sx={{
                  width: '100%',
                  justifyContent: 'space-between',
                  px: 1.5,
                  mb: 1,
                  py: 0.25,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    color: isClosed && activeInside ? 'primary.main' : 'text.secondary',
                    letterSpacing: '0.14em',
                    fontSize: '0.65rem',
                  }}
                >
                  {section.subheader}
                </Typography>
                <ExpandMoreRoundedIcon
                  fontSize="small"
                  sx={{
                    color: 'text.secondary',
                    transform: isClosed ? 'rotate(-90deg)' : 'none',
                    transition: (theme) => theme.transitions.create('transform', { duration: 150 }),
                  }}
                />
              </ButtonBase>
            )}
            {collapsed && i > 0 && <Divider sx={{ my: 1, mx: 1.25, borderColor: 'divider' }} />}
            <Collapse in={collapsed || !isClosed} timeout={200}>
              <List disablePadding>{section.items.map((item) => renderItem(item))}</List>
            </Collapse>
            {!collapsed && i < sections.length - 1 && (
              <Divider
                sx={(theme) => ({
                  my: 2,
                  borderColor: 'divider',
                  ml: theme.spacing(-drawerPaddingX.pl),
                  mr: theme.spacing(-drawerPaddingX.pr),
                  width: `calc(100% + ${theme.spacing(drawerPaddingX.pl + drawerPaddingX.pr)})`,
                })}
              />
            )}
          </Box>
          )
        })}
      </Box>

      {!collapsed && (
        <Box sx={{ mt: 'auto', py: 2, px: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
            The Retech
          </Typography>
          <Typography variant="caption" sx={{ color: lp.zinc500, fontSize: '0.65rem' }}>
            Finanças familiares
          </Typography>
        </Box>
      )}
    </Box>
  )
}
