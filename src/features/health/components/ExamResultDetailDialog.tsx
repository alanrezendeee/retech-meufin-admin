import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useQuery } from '@tanstack/react-query'
import { getExamResult, type ExamResultItem } from '../api'
import { errorMessage, healthKeys } from '../constants'
import { LoadingState } from './StateViews'
import { resultNumber, TierFit } from './TierFit'

const INTERP_LABEL: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  normal: { label: 'Dentro da faixa', color: 'success' },
  low: { label: 'Abaixo da faixa', color: 'warning' },
  high: { label: 'Acima da faixa', color: 'warning' },
  critical: { label: 'Crítico', color: 'error' },
}

function refRange(it: ExamResultItem): string {
  if (it.reference_min != null && it.reference_max != null)
    return `${it.reference_min}–${it.reference_max}`
  if (it.reference_max != null) return `< ${it.reference_max}`
  if (it.reference_min != null) return `> ${it.reference_min}`
  return '—'
}

/**
 * Visualização dos itens de um resultado salvo: valor, referência, situação e
 * o confronto informativo com as metas condicionais do catálogo (ex.: LDL) —
 * mesma leitura da revisão de importação, agora no exame já gravado.
 */
export function ExamResultDetailDialog({
  resultId,
  title,
  open,
  onClose,
}: {
  resultId: string
  title: string
  open: boolean
  onClose: () => void
}) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: [...healthKeys.examResults(), 'detail', resultId] as const,
    queryFn: () => getExamResult(resultId),
    enabled: open,
  })

  const items = data?.items ?? []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle>
      <DialogContent>
        {isPending ? (
          <LoadingState label="Carregando itens…" />
        ) : isError ? (
          <Alert severity="error">{errorMessage(error)}</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {data?.summary && (
              <Typography variant="body2" color="text.secondary">
                {data.summary}
              </Typography>
            )}
            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 240 }}>Marcador</TableCell>
                    <TableCell sx={{ width: 140 }}>Resultado</TableCell>
                    <TableCell sx={{ width: 100 }}>Unidade</TableCell>
                    <TableCell sx={{ width: 120 }}>Referência</TableCell>
                    <TableCell sx={{ width: 160 }}>Situação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, idx) => {
                    const refInfo = it.reference_text ?? it.marker_ref_text
                    const interp = it.interpretation_computed
                      ? INTERP_LABEL[it.interpretation_computed]
                      : null
                    const num = resultNumber(it.result_numeric ?? it.result_value)
                    const tiers = it.marker_ref_tiers ?? []
                    return (
                      <TableRow key={it.id ?? idx} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={600}>
                                {it.marker_name ?? it.raw_marker_name ?? '—'}
                              </Typography>
                              {refInfo && (
                                <Tooltip
                                  title={
                                    <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                                      {refInfo}
                                    </Typography>
                                  }
                                  arrow
                                >
                                  <InfoOutlinedIcon
                                    fontSize="inherit"
                                    sx={{ color: 'text.secondary', cursor: 'help' }}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                            {tiers.length > 0 && num != null && (
                              <TierFit value={num} tiers={tiers} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{String(it.result_value)}</TableCell>
                        <TableCell>{it.unit ?? '—'}</TableCell>
                        <TableCell>{refRange(it)}</TableCell>
                        <TableCell>
                          {interp ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              color={interp.color}
                              label={interp.label}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              sem faixa aplicável
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="info" variant="outlined">
              Classificação automática frente às faixas impressas no laudo e às tabelas do
              catálogo — não é avaliação médica. Interprete os resultados com o seu médico.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
