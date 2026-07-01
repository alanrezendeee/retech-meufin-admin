import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, Drawer, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import { MainHeader, LAYOUT_DRAWER_WIDTH } from '@/components/layout/MainHeader'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { useUiStore } from '@/store/uiStore'

export function DashboardLayout() {
  const theme = useTheme()
  const isLg = useMediaQuery(theme.breakpoints.up('lg'))
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUiStore()

  useEffect(() => {
    if (isLg) setSidebarOpen(false)
  }, [isLg, setSidebarOpen])

  const desktopExpanded = isLg && !sidebarCollapsed
  const drawer = <SidebarNav onNavigate={() => setSidebarOpen(false)} />

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <MainHeader />

      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: LAYOUT_DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {!sidebarCollapsed && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: LAYOUT_DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: LAYOUT_DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: desktopExpanded ? `calc(100% - ${LAYOUT_DRAWER_WIDTH}px)` : '100%' },
          minHeight: '100vh',
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, sm: 72 } }} />
        <Outlet />
      </Box>
    </Box>
  )
}
