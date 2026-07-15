import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import { useAuth } from '@/auth/context/jwt/auth-provider'
import { lp } from '@/theme/tokens'
import { BirthdayBoard } from '@/features/health/components/BirthdayBoard'

function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
  progress,
}: {
  title: string
  value: string
  hint: string
  icon: typeof TrendingUpRoundedIcon
  progress?: number
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontFamily: (t) => t.typography.h5.fontFamily, fontWeight: 800, mt: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              {hint}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.15 : 0.12),
              color: 'primary.main',
            }}
          >
            <Icon />
          </Box>
        </Stack>
        {progress != null && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 2,
              height: 6,
              borderRadius: 3,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: lp.neon },
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: (t) => t.typography.h4.fontFamily }}>
            Olá, {user?.name?.split(' ')[0] ?? 'visitante'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Visão geral das suas finanças — módulos adicionais entram aqui em breve.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label="Demo" color="primary" size="small" variant="filled" sx={{ fontWeight: 700 }} />
          <Button variant="outlined" size="medium" disabled>
            Nova transação
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard
            title="Receitas (mês)"
            value="R$ —"
            hint="Conecte a API para dados reais"
            icon={TrendingUpRoundedIcon}
            progress={0}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard title="Despesas (mês)" value="R$ —" hint="Categorias e recorrências em desenvolvimento" icon={PaymentsRoundedIcon} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <SummaryCard title="Reserva / metas" value="—" hint="Planos de conquista no roadmap" icon={SavingsRoundedIcon} />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', minHeight: 280 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ fontFamily: (t) => t.typography.h6.fontFamily }}>
                Fluxo do mês
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                Gráficos com Recharts serão adicionados neste painel (padrão dashboard tipo Minimals).
              </Typography>
              <Box
                sx={{
                  height: 200,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.04 : 0.03),
                }}
              >
                <Typography variant="body2" color="text.disabled">
                  Área do gráfico
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ fontFamily: (t) => t.typography.h6.fontFamily }}>
                Próximos passos
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {['API de transações', 'Categorias e orçamento', 'Cartões e faturas'].map((item, i) => (
                  <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        bgcolor: (t) => alpha(t.palette.primary.main, 0.15),
                        color: 'primary.main',
                      }}
                    >
                      {i + 1}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <BirthdayBoard />
        </Grid>
      </Grid>
    </Box>
  )
}
