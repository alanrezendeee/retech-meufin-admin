import { Box, Typography } from '@mui/material'
import type { RefTier } from '../api'

/** Formata uma meta condicional: "Risco baixo (<130)". */
export function tierLabel(t: RefTier): string {
  if (t.min != null && t.max != null) return `${t.label} (${t.min}–${t.max})`
  if (t.max != null) return `${t.label} (<${t.max})`
  if (t.min != null) return `${t.label} (>${t.min})`
  return t.label
}

/** Valor atende a meta? Metas "inferior a X" usam < estrito. */
export function tierMeets(value: number, t: RefTier): boolean {
  if (t.min != null && value <= t.min) return false
  if (t.max != null && value >= t.max) return false
  return true
}

/** Extrai o número de um valor de resultado editável/impresso ("78 mg/dL", "1,25"). */
export function resultNumber(v: string | number | null | undefined): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Confronto INFORMATIVO do valor com as metas condicionais do catálogo (ex.:
 * LDL por risco cardiovascular): lista o que o valor atende/não atende, linha
 * a linha da tabela — classificação sistemática do laudo, não avaliação
 * médica (qual linha vale para a pessoa é estratificação do médico).
 */
export function TierFit({ value, tiers }: { value: number; tiers: RefTier[] }) {
  const meets = tiers.filter((t) => tierMeets(value, t)).map(tierLabel)
  const fails = tiers.filter((t) => !tierMeets(value, t)).map(tierLabel)
  return (
    <Typography variant="caption" color="text.secondary">
      {meets.length > 0 && (
        <>
          Atende: <Box component="span" sx={{ color: 'success.main' }}>{meets.join(', ')}</Box>
        </>
      )}
      {meets.length > 0 && fails.length > 0 && ' · '}
      {fails.length > 0 && (
        <>
          Não atende: <Box component="span" sx={{ color: 'warning.main' }}>{fails.join(', ')}</Box>
        </>
      )}
    </Typography>
  )
}
