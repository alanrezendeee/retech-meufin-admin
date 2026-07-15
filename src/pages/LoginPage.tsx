import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  alpha,
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuth } from '@/auth/context/jwt/auth-provider'
import { UserFacingError } from '@/lib/errors'
import LoginIllustration from '@/components/auth/LoginIllustration'
import { AppLogo } from '@/components/layout/AppLogo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { colorTemplate } from '@/theme/colorTemplate'
import { lp } from '@/theme/tokens'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, checkUserSession, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      await login(data)
    } catch (err) {
      setError(UserFacingError.message(err, 'login'))
      return
    }
    try {
      await checkUserSession()
    } catch (err) {
      setError(UserFacingError.message(err, 'session'))
      return
    }
    navigate('/dashboard')
  }

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

      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ThemeToggle />
      </Box>

      <Box sx={{ display: 'flex', flex: 1, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Painel esquerdo — mesmo DNA visual do LP Meu n8n */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            px: 6,
            py: 8,
            borderRight: 1,
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          <Box sx={{ maxWidth: 480, textAlign: { md: 'left' } }}>
            <Box sx={{ mb: 3 }}>
              <AppLogo />
            </Box>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.5,
                mb: 2,
                borderRadius: 10,
                border: `1px solid ${alpha(lp.neon, 0.25)}`,
                bgcolor: alpha(lp.neon, 0.06),
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: lp.neon,
                  boxShadow: `0 0 8px ${lp.neon}`,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: lp.neonBright,
                }}
              >
                Gestão familiar · Simples e segura
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: (t) => t.typography.h3.fontFamily,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                mb: 2,
              }}
            >
              Suas finanças em um só{' '}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(90deg, ${lp.neonBright} 0%, ${lp.neon} 50%, ${colorTemplate.primary.gradientEnd} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                lugar
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 420 }}>
              Controle receitas, despesas e metas com a mesma experiência visual da família de produtos
              The Retech.
            </Typography>
            <LoginIllustration />
          </Box>
        </Box>

        {/* Formulário */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            py: { xs: 8, md: 6 },
          }}
        >
          <Container maxWidth="sm">
            <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
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
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                Acesse sua conta
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                ReTechFin Admin — gestão financeira familiar
              </Typography>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2.5}>
                  {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                      {error}
                    </Alert>
                  )}

                  <TextField
                    {...register('email')}
                    label="E-mail"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    autoComplete="email"
                  />

                  <TextField
                    {...register('password')}
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    autoComplete="current-password"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      variant="body2"
                      underline="hover"
                      color="primary"
                    >
                      Esqueceu a senha?
                    </Link>
                  </Box>

                  <Button type="submit" variant="contained" color="primary" size="large" fullWidth disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Container>
        </Box>
      </Box>
    </Box>
  )
}
