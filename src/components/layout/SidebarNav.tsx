import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { AppLogo } from './AppLogo'
import { SidebarUserCard } from './SidebarUserCard'
import { MenuInfoPopover } from './MenuInfoPopover'
import { lp } from '@/theme/tokens'
import { retechfinNavSections } from '@/layouts/nav-config-retechfin'
import { useFilteredNavData, type NavDataItem } from '@/layouts/components/nav-filter-by-casl'

/** Padding horizontal do conteúdo; à direita um pouco maior para o logo não colar na borda */
const drawerPaddingX = { pl: 0.5, pr: 3.5 } as const

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const sections = useFilteredNavData(retechfinNavSections)

  const renderItem = (item: NavDataItem) => {
    const { path, label, icon: Icon, soon } = item
    const selected = !soon && pathname === path

    const button = (
      <ListItemButton
        {...(!soon ? { component: RouterLink, to: path } : {})}
        selected={selected}
        disabled={soon}
        onClick={soon ? undefined : onNavigate}
        sx={{
          py: 1.1,
          opacity: soon ? 0.55 : 1,
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: selected ? 'primary.main' : 'text.secondary' }}>
          <Icon fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: selected ? 700 : 500,
          }}
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
            <Box
              sx={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
              }}
            >
              <MenuInfoPopover ruleKey={item.info} />
            </Box>
          )}
        </Box>
      </ListItem>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...drawerPaddingX, pt: 2.5, pl: 3.5 }}>
      <Box
        component={RouterLink}
        to="/dashboard"
        onClick={onNavigate}
        sx={{ textDecoration: 'none', color: 'inherit', mb: 1 }}
      >
        <AppLogo />
      </Box>

      <SidebarUserCard />

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {sections.map((section, i) => (
          <Box key={section.subheader ?? `section-${i}`}>
            {section.subheader && (
              <Typography
                variant="overline"
                sx={{ px: 1.5, mb: 1, color: 'text.secondary', letterSpacing: '0.14em', fontSize: '0.65rem' }}
              >
                {section.subheader}
              </Typography>
            )}
            <List disablePadding>{section.items.map((item) => renderItem(item))}</List>
            {i < sections.length - 1 && (
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
        ))}
      </Box>

      <Box sx={{ mt: 'auto', py: 2, px: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
          The Retech
        </Typography>
        <Typography variant="caption" sx={{ color: lp.zinc500, fontSize: '0.65rem' }}>
          Finanças familiares
        </Typography>
      </Box>
    </Box>
  )
}
