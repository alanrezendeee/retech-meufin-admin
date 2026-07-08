import { useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded'
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { formatCents, getInstallmentsProjection, listCards } from '../api'
import { errorMessage, financeKeys } from '../constants'
import { useExpenseCategories } from '../hooks/useExpenseCategories'
import { PageHeader } from '@/features/health/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'

const MONTH_SHORT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

/** "2026-08" → "ago/26" */
function monthLabel(ym: string): string {
  const m = Number(ym.slice(5, 7))
  return `${MONTH_SHORT[m - 1] ?? ym}/${ym.slice(2, 4)}`
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {icon}
          <Typography variant="overline" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default function ParcelamentosPage() {
  const theme = useTheme()
  const { labelOf } = useExpenseCategories()

  const projectionQuery = useQuery({
    queryKey: [...financeKeys.all, 'installments-projection'] as const,
    queryFn: getInstallmentsProjection,
  })
  const cardsQuery = useQuery({
    queryKey: financeKeys.cards(),
    queryFn: listCards,
  })

  const cardName = (id?: string | null) =>
    (cardsQuery.data ?? []).find((c) => c.id === id)?.name ?? '—'

  const proj = projectionQuery.data
  const groups = proj?.groups ?? []
  const monthly = useMemo(() => proj?.monthly ?? [], [proj])

  const chartData = useMemo(
    () =>
      monthly.map((m) => ({
        name: monthLabel(m.month),
        valor: m.total_cents / 100,
        parcelas: m.count,
      })),
    [monthly],
  )

  const nextMonth = monthly[0]
  const lastMonth = monthly[monthly.length - 1]

  return (
    <>
      <PageHeader
        title="Parcelamentos"
        subtitle="Compromissos parcelados dentro das faturas de cartão — projeção calculada a partir das compras importadas (não são lançamentos)."
      />

      {projectionQuery.isLoading ? (
        <LoadingState />
      ) : projectionQuery.isError ? (
        <ErrorState
          message={errorMessage(projectionQuery.error)}
          onRetry={projectionQuery.refetch}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<TimelineRoundedIcon />}
          title="Nenhum parcelamento ativo identificado"
          description="Importe faturas com compras parceladas (ex.: PARC 03/10) — a projeção dos meses futuros aparece aqui automaticamente."
        />
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<PaidRoundedIcon fontSize="small" color="warning" />}
                label="Comprometido total"
                value={formatCents(proj!.remaining_total_cents)}
                hint="Parcelas futuras já contratadas"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CalendarMonthRoundedIcon fontSize="small" color="warning" />}
                label="Próximo mês"
                value={nextMonth ? formatCents(nextMonth.total_cents) : '—'}
                hint={
                  nextMonth
                    ? `${monthLabel(nextMonth.month)} — ${nextMonth.count} parcela(s)`
                    : undefined
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<CreditCardRoundedIcon fontSize="small" color="info" />}
                label="Parcelamentos ativos"
                value={String(groups.length)}
                hint="Identificados nas faturas importadas"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                icon={<TimelineRoundedIcon fontSize="small" color="success" />}
                label="Livre a partir de"
                value={lastMonth ? monthLabel(lastMonth.month) : '—'}
                hint="Mês seguinte à última parcela"
              />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                Comprometimento mensal futuro
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      stroke={theme.palette.divider}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      stroke={theme.palette.divider}
                      tickFormatter={(v: number) =>
                        v.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        })
                      }
                    />
                    <ReTooltip
                      formatter={(v, name) =>
                        name === 'Comprometido'
                          ? Number(v ?? 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          : v
                      }
                      contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="valor" name="Comprometido" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={alpha(theme.palette.warning.main, 0.85)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Cartão</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Progresso</TableCell>
                    <TableCell align="right">Parcela</TableCell>
                    <TableCell align="right">Restante</TableCell>
                    <TableCell>Termina em</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((g, i) => {
                    const pct = Math.round((g.last_known_number / g.installment_total) * 100)
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{g.description}</TableCell>
                        <TableCell>{cardName(g.card_id)}</TableCell>
                        <TableCell>{g.category ? labelOf(g.category) : '—'}</TableCell>
                        <TableCell>
                          <Tooltip title={`${pct}% pago`}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                color={pct >= 70 ? 'success' : 'warning'}
                                sx={{ flex: 1, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 44 }}>
                                {g.last_known_number}/{g.installment_total}
                              </Typography>
                            </Stack>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">{formatCents(g.installment_cents)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatCents(g.remaining_cents)}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {g.remaining_count}x de {formatCents(g.installment_cents)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" variant="outlined" label={monthLabel(g.ends_at)} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      )}
    </>
  )
}
