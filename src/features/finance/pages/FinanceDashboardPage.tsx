import { useMemo, useState } from 'react'
import {
  alpha,
  Box,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import CallReceivedRoundedIcon from '@mui/icons-material/CallReceivedRounded'
import CallMadeRoundedIcon from '@mui/icons-material/CallMadeRounded'
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatCents,
  getFinanceDashboard,
  getFinanceDashboardMonthly,
  listFamilyMembers,
} from '../api'
import {
  errorMessage,
  EXPENSE_CATEGORY_LABEL,
  financeKeys,
  MONTH_OPTIONS,
  yearOptions,
} from '../constants'
import { PageHeader } from '@/features/health/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function MoneyCard({
  title,
  mainCents,
  secondaryCents,
  secondaryLabel,
  icon: Icon,
  tone = 'primary',
}: {
  title: string
  mainCents: number
  secondaryCents?: number
  secondaryLabel?: string
  icon: typeof TrendingUpRoundedIcon
  tone?: 'primary' | 'success' | 'error' | 'warning' | 'info'
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, whiteSpace: 'nowrap' }}>
              {formatCents(mainCents)}
            </Typography>
            {secondaryCents != null && (
              <Typography variant="caption" color="text.secondary">
                {secondaryLabel}: {formatCents(secondaryCents)}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (t) => alpha(t.palette[tone].main, t.palette.mode === 'dark' ? 0.18 : 0.12),
              color: `${tone}.main`,
            }}
          >
            <Icon fontSize="small" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function FinanceDashboardPage() {
  const theme = useTheme()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [familyMemberId, setFamilyMemberId] = useState('')

  const params = useMemo(
    () => ({ year, month, family_member_id: familyMemberId || undefined }),
    [year, month, familyMemberId]
  )
  const yearParams = useMemo(
    () => ({ year, family_member_id: familyMemberId || undefined }),
    [year, familyMemberId]
  )

  const summaryQ = useQuery({
    queryKey: financeKeys.dashboard(params),
    queryFn: () => getFinanceDashboard(params),
  })
  const monthlyQ = useQuery({
    queryKey: financeKeys.dashboardMonthly(yearParams),
    queryFn: () => getFinanceDashboardMonthly(yearParams),
  })
  const { data: members } = useQuery({
    queryKey: financeKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })

  const s = summaryQ.data
  const balanceExpected = s?.balance_expected_cents ?? 0

  const chartData = useMemo(
    () =>
      (monthlyQ.data?.months ?? []).map((m) => ({
        name: MONTH_SHORT[m.month - 1],
        receita: (m.income_expected_cents ?? 0) / 100,
        despesa: (m.expense_expected_cents ?? 0) / 100,
        saldo: (m.balance_expected_cents ?? 0) / 100,
      })),
    [monthlyQ.data]
  )

  const categoryData = useMemo(
    () =>
      (s?.categories ?? []).slice(0, 10).map((c) => ({
        name:
          c.category === 'cartao'
            ? 'Fatura de cartão'
            : (EXPENSE_CATEGORY_LABEL[c.category] ?? c.category),
        valor: c.total_cents / 100,
      })),
    [s]
  )

  const brl = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <>
      <PageHeader
        title="Dashboard Financeira"
        subtitle="Como estou este mês, o que ainda vem, pra onde foi o dinheiro e o que já está comprometido."
        action={
          <Stack direction="row" spacing={1.5}>
            <TextField
              select
              size="small"
              label="Mês"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              sx={{ minWidth: 130 }}
            >
              {MONTH_OPTIONS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Ano"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{ minWidth: 100 }}
            >
              {yearOptions().map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Membro"
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">
                <em>Todos</em>
              </MenuItem>
              {(members ?? []).map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.full_name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      {summaryQ.isLoading ? (
        <LoadingState />
      ) : summaryQ.isError ? (
        <ErrorState message={errorMessage(summaryQ.error)} onRetry={summaryQ.refetch} />
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MoneyCard
              title="Receitas do mês"
              mainCents={s?.income_realized_cents ?? 0}
              secondaryCents={s?.income_expected_cents ?? 0}
              secondaryLabel="Previsto"
              icon={TrendingUpRoundedIcon}
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MoneyCard
              title="Despesas do mês"
              mainCents={s?.expense_realized_cents ?? 0}
              secondaryCents={s?.expense_expected_cents ?? 0}
              secondaryLabel="Previsto"
              icon={TrendingDownRoundedIcon}
              tone="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MoneyCard
              title="Saldo do mês"
              mainCents={s?.balance_realized_cents ?? 0}
              secondaryCents={balanceExpected}
              secondaryLabel="Previsto"
              icon={AccountBalanceWalletRoundedIcon}
              tone={balanceExpected >= 0 ? 'success' : 'error'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MoneyCard
              title="A receber"
              mainCents={s?.receivable_cents ?? 0}
              icon={CallReceivedRoundedIcon}
              tone="info"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MoneyCard
              title="A pagar"
              mainCents={s?.payable_cents ?? 0}
              icon={CallMadeRoundedIcon}
              tone="warning"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <MoneyCard
              title="Parcelas futuras"
              mainCents={s?.future_installments.total_cents ?? 0}
              secondaryCents={undefined}
              secondaryLabel={undefined}
              icon={EventRepeatRoundedIcon}
              tone="warning"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Receita × Despesa no ano
                </Typography>
                {monthlyQ.isLoading ? (
                  <LoadingState />
                ) : monthlyQ.isError ? (
                  <ErrorState
                    message={errorMessage(monthlyQ.error)}
                    onRetry={monthlyQ.refetch}
                  />
                ) : (
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                          stroke={theme.palette.divider}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                          stroke={theme.palette.divider}
                          tickFormatter={(v: number) => brl(v)}
                          width={90}
                        />
                        <ReTooltip
                          formatter={(v) => brl(Number(v ?? 0))}
                          contentStyle={{
                            background: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Bar
                          dataKey="receita"
                          name="Receita"
                          fill={alpha(theme.palette.success.main, 0.75)}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="despesa"
                          name="Despesa"
                          fill={alpha(theme.palette.error.main, 0.7)}
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="saldo"
                          name="Saldo"
                          stroke={theme.palette.info.main}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary">
                  Inclui lançamentos previstos até o fim do ano. Faturas de cartão contam pelo
                  total (as compras dentro delas não duplicam).
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Pra onde foi o dinheiro ({MONTH_OPTIONS.find((m) => m.value === month)?.label})
                </Typography>
                {categoryData.length === 0 ? (
                  <EmptyState
                    title="Sem despesas no período"
                    description="Nenhuma despesa registrada neste mês (com o filtro atual)."
                  />
                ) : (
                  <Box sx={{ height: Math.max(220, categoryData.length * 44) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        layout="vertical"
                        margin={{ top: 4, right: 32, bottom: 4, left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                          stroke={theme.palette.divider}
                          tickFormatter={(v: number) => brl(v)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={140}
                          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                          stroke={theme.palette.divider}
                        />
                        <ReTooltip
                          formatter={(v) => brl(Number(v ?? 0))}
                          contentStyle={{
                            background: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="valor" name="Despesa" radius={[0, 4, 4, 0]}>
                          {categoryData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={alpha(theme.palette.error.main, 0.85 - i * 0.06)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary">
                  Compras de fatura importada aparecem pela categoria real de cada item.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </>
  )
}
