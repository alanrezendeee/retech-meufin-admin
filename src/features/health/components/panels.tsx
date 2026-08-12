import { useMemo, useState } from 'react'
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material'
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
import type { EvolutionMode, EvolutionPoint, PanelMarker } from '../api'
import { MARKER_CATEGORY_LABEL } from '../constants'
import { lp } from '@/theme/tokens'
import { formatDateBR } from '@/utils/dates'

// ---------------------------------------------------------------------------
// Painéis: título por categoria do catálogo
// ---------------------------------------------------------------------------

export const PANEL_TITLE: Record<string, string> = {
  hematologia: 'Painel Hematológico',
  bioquimica: 'Painel Metabólico',
  lipidico: 'Painel Lipídico',
  hepatico: 'Painel Hepático',
  renal: 'Painel Renal',
  eletrolitos: 'Painel de Eletrólitos e Minerais',
  hormonios: 'Painel Hormonal',
  vitaminas: 'Painel de Vitaminas',
  inflamacao: 'Painel de Inflamação',
  coagulacao: 'Painel de Coagulação',
  sorologia: 'Sorologias',
  urina: 'Painel de Urina',
  espermograma: 'Espermograma',
  outros: 'Outros marcadores',
}

export function panelTitle(category: string): string {
  return PANEL_TITLE[category] ?? MARKER_CATEGORY_LABEL[category] ?? `Painel ${category}`
}

// ---------------------------------------------------------------------------
// Situação do último ponto
// ---------------------------------------------------------------------------

export const INTERP_CHIP: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  normal: { label: 'na faixa', color: 'success' },
  low: { label: 'abaixo', color: 'warning' },
  high: { label: 'acima', color: 'warning' },
  critical: { label: 'crítico', color: 'error' },
}

export function lastPoint(pm: PanelMarker): EvolutionPoint | null {
  return pm.points.length > 0 ? pm.points[pm.points.length - 1] : null
}

// ---------------------------------------------------------------------------
// Gráfico (compartilhado entre mini e dialog)
// ---------------------------------------------------------------------------

export function EvolutionLineChart({
  points,
  mode,
  unit,
  mini,
}: {
  points: EvolutionPoint[]
  mode: EvolutionMode
  unit?: string | null
  mini?: boolean
}) {
  const theme = useTheme()
  const data = useMemo(
    () =>
      points.map((p) => ({
        date: p.exam_date,
        value: p.value,
        normalized: p.normalized ?? null,
        refMin: p.reference_min ?? null,
        refMax: p.reference_max ?? null,
      })),
    [points]
  )
  const refBand = useMemo(() => {
    const withRef = data.find((d) => d.refMin != null && d.refMax != null)
    return withRef ? { min: withRef.refMin as number, max: withRef.refMax as number } : null
  }, [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={mini ? { top: 4, right: 4, bottom: 0, left: 4 } : { top: 8, right: 24, bottom: 8, left: 0 }}
      >
        {!mini && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
        <XAxis
          dataKey="date"
          hide={mini}
          tickFormatter={formatDateBR}
          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          stroke={theme.palette.divider}
        />
        <YAxis
          hide={mini}
          domain={mode === 'normalized' ? [-1.5, 1.5] : ['auto', 'auto']}
          tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
          stroke={theme.palette.divider}
        />
        <ReTooltip
          labelFormatter={(v) => formatDateBR(String(v))}
          contentStyle={{
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        {mode === 'normalized' ? (
          <>
            <ReferenceArea y1={-1} y2={1} fill={alpha(theme.palette.success.main, 0.12)} stroke="none" />
            <Line
              type="monotone"
              dataKey="normalized"
              name="Normalizado"
              stroke={lp.neon}
              strokeWidth={2}
              dot={{ r: mini ? 2 : 3 }}
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
              name={unit ? `Valor (${unit})` : 'Valor'}
              stroke={lp.neon}
              strokeWidth={2}
              dot={{ r: mini ? 2 : 3 }}
              connectNulls
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Mini-gráfico de um marcador
// ---------------------------------------------------------------------------

export function MiniMarkerCard({
  pm,
  density,
  onOpen,
}: {
  pm: PanelMarker
  density: 'compact' | 'comfortable'
  onOpen: () => void
}) {
  const last = lastPoint(pm)
  const chip = last?.interpretation ? INTERP_CHIP[last.interpretation] : null
  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        '&:hover': { borderColor: 'primary.main' },
      }}
      onClick={onOpen}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight={700} noWrap title={pm.marker.canonical_name}>
            {pm.marker.canonical_name}
          </Typography>
          {chip && <Chip size="small" variant="outlined" color={chip.color} label={chip.label} />}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {last?.value != null ? `${String(last.value).replace('.', ',')} ${last.unit ?? pm.marker.canonical_unit ?? ''}` : '—'}
          {last && ` · ${formatDateBR(last.exam_date)}`}
        </Typography>
        <Box sx={{ height: density === 'compact' ? 72 : 140, mt: 0.5 }}>
          <EvolutionLineChart
            points={pm.points}
            mode={pm.default_mode}
            unit={pm.marker.canonical_unit}
            mini
          />
        </Box>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Dialog com o gráfico grande (dados já carregados; sem nova chamada)
// ---------------------------------------------------------------------------

export function MarkerChartDialog({ pm, onClose }: { pm: PanelMarker | null; onClose: () => void }) {
  const [mode, setMode] = useState<EvolutionMode | null>(null)
  const effectiveMode: EvolutionMode = mode ?? pm?.default_mode ?? 'absolute'
  return (
    <Dialog open={Boolean(pm)} onClose={onClose} maxWidth="md" fullWidth>
      {pm && (
        <>
          <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {pm.marker.canonical_name}
            <ToggleButtonGroup
              size="small"
              exclusive
              value={effectiveMode}
              onChange={(_, v) => v && setMode(v)}
            >
              <ToggleButton value="absolute">Absoluto</ToggleButton>
              <ToggleButton value="normalized">Normalizado</ToggleButton>
            </ToggleButtonGroup>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ height: 360 }}>
              <EvolutionLineChart
                points={pm.points}
                mode={effectiveMode}
                unit={pm.marker.canonical_unit}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {effectiveMode === 'normalized'
                ? 'Modo normalizado: faixa verde −1..+1 representa o intervalo de referência.'
                : 'Modo absoluto: faixa verde representa o intervalo de referência do exame.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} color="inherit">
              Fechar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}

