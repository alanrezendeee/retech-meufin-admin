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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material'
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded'
import { useQuery } from '@tanstack/react-query'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getHealthDashboard,
  getMarkerEvolution,
  listFamilyMembers,
  listMarkers,
  type EvolutionMode,
} from '../api'
import { errorMessage, healthKeys } from '../constants'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { lp } from '@/theme/tokens'

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number | string
  icon: typeof GroupsRoundedIcon
}) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontFamily: (t) => t.typography.h5.fontFamily, fontWeight: 800, mt: 0.5 }}
            >
              {value}
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
      </CardContent>
    </Card>
  )
}

function EvolutionChart() {
  const theme = useTheme()
  const [markerId, setMarkerId] = useState('')
  const [familyMemberId, setFamilyMemberId] = useState('')
  const [mode, setMode] = useState<EvolutionMode | null>(null)

  const { data: members } = useQuery({
    queryKey: healthKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })

  const markerParams = useMemo(() => ({ limit: 100, offset: 0 }), [])
  const { data: markersData } = useQuery({
    queryKey: healthKeys.markers(markerParams),
    queryFn: () => listMarkers(markerParams),
  })
  const markers = markersData?.items ?? []

  const evoParams = useMemo(
    () => ({ family_member_id: familyMemberId || undefined }),
    [familyMemberId]
  )

  const {
    data: evolution,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: healthKeys.evolution(markerId, evoParams),
    queryFn: () => getMarkerEvolution(markerId, evoParams),
    enabled: Boolean(markerId),
  })

  // Modo efetivo: override do usuário tem prioridade; senão usa o default_mode
  // que a API retorna para o marcador. Ao trocar de marcador o override é
  // resetado (setMode(null)) — sem necessidade de efeito.
  const effectiveMode: EvolutionMode = mode ?? evolution?.default_mode ?? 'absolute'

  const chartData = useMemo(() => {
    if (!evolution) return []
    return evolution.points.map((p) => ({
      date: p.exam_date,
      value: p.value,
      normalized: p.normalized ?? null,
      refMin: p.reference_min ?? null,
      refMax: p.reference_max ?? null,
    }))
  }, [evolution])

  const refBand = useMemo(() => {
    const withRef = chartData.find((d) => d.refMin != null && d.refMax != null)
    return withRef ? { min: withRef.refMin as number, max: withRef.refMax as number } : null
  }, [chartData])

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ fontFamily: (t) => t.typography.h6.fontFamily }}>
            Evolução por marcador
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              select
              size="small"
              label="Marcador"
              value={markerId}
              onChange={(e) => {
                setMarkerId(e.target.value)
                setMode(null)
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">
                <em>Selecione…</em>
              </MenuItem>
              {markers.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.canonical_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Membro"
              value={familyMemberId}
              onChange={(e) => setFamilyMemberId(e.target.value)}
              sx={{ minWidth: 180 }}
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
            <ToggleButtonGroup
              size="small"
              exclusive
              value={effectiveMode}
              onChange={(_, v) => v && setMode(v)}
            >
              <ToggleButton value="absolute">Absoluto</ToggleButton>
              <ToggleButton value="normalized">Normalizado</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        {!markerId ? (
          <EmptyState
            icon={<BiotechRoundedIcon />}
            title="Selecione um marcador"
            description="Escolha um marcador (e opcionalmente um membro) para ver a evolução ao longo do tempo."
          />
        ) : isLoading ? (
          <LoadingState label="Carregando evolução…" />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : chartData.length === 0 ? (
          <EmptyState
            title="Sem pontos para exibir"
            description="Ainda não há resultados suficientes deste marcador para montar o gráfico."
          />
        ) : (
          <>
            <Box sx={{ height: 360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                    stroke={theme.palette.divider}
                  />
                  {effectiveMode === 'normalized' ? (
                    <YAxis
                      domain={[-1.5, 1.5]}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      stroke={theme.palette.divider}
                    />
                  ) : (
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      stroke={theme.palette.divider}
                    />
                  )}
                  <ReTooltip
                    contentStyle={{
                      background: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />

                  {effectiveMode === 'normalized' ? (
                    <>
                      <ReferenceArea
                        y1={-1}
                        y2={1}
                        fill={alpha(theme.palette.success.main, 0.12)}
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="normalized"
                        name="Normalizado"
                        stroke={lp.neon}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    </>
                  ) : (
                    <>
                      {refBand && (
                        <ReferenceArea
                          y1={refBand.min}
                          y2={refBand.max}
                          fill={alpha(theme.palette.success.main, 0.12)}
                          stroke="none"
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={
                          evolution?.marker.canonical_unit
                            ? `Valor (${evolution.marker.canonical_unit})`
                            : 'Valor'
                        }
                        stroke={lp.neon}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {effectiveMode === 'normalized'
                ? 'Modo normalizado: faixa verde −1..+1 representa o intervalo de referência.'
                : 'Modo absoluto: faixa verde representa o intervalo de referência do exame.'}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function HealthDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: healthKeys.dashboard(),
    queryFn: getHealthDashboard,
  })

  return (
    <>
      <PageHeader
        title="Dashboard Saúde"
        subtitle="Visão geral da saúde familiar e evolução dos marcadores."
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : (
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Membros" value={data?.family_members ?? 0} icon={GroupsRoundedIcon} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard title="Resultados" value={data?.exam_results ?? 0} icon={DescriptionRoundedIcon} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Marcadores (tenant)"
              value={data?.tenant_markers ?? 0}
              icon={BiotechRoundedIcon}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Documentos p/ revisar"
              value={data?.documents_pending_review ?? 0}
              icon={PendingActionsRoundedIcon}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <EvolutionChart />
          </Grid>
        </Grid>
      )}
    </>
  )
}
