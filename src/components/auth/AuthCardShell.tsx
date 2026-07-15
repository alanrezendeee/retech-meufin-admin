import type { ReactNode } from 'react'
import { alpha, Box, Container, Paper } from '@mui/material'
import { AppLogo } from '@/components/layout/AppLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { lp } from '@/theme/tokens'

/**
 * Casca visual das telas públicas de conta (esqueci a senha / redefinir senha):
 * mesmo fundo com glow neon e card translúcido do LoginPage, em coluna única.
 */
export function AuthCardShell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: (t) =>
            t.palette.mode === 'dark'
              ? `radial-gradient(ellipse 80% 50% at 50% -20%, ${alpha(lp.neon, 0.16)}, transparent),
                 radial-gradient(circle at 80% 60%, ${alpha(lp.neonDim, 0.08)}, transparent 50%)`
              : `radial-gradient(ellipse 70% 40% at 50% 0%, ${alpha(lp.neon, 0.12)}, transparent)`,
        }}
      />

      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
        <ThemeToggle />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 8,
        }}
      >
        <Container maxWidth="xs">
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <AppLogo />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              bgcolor: (t) => alpha(t.palette.background.paper, t.palette.mode === 'dark' ? 0.85 : 0.98),
              backdropFilter: 'blur(20px)',
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}
