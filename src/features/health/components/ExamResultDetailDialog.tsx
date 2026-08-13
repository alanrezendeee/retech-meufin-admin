import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteExamResultItem,
  getDocumentDownloadUrl,
  getExamResult,
  linkDocument,
  listDocumentsPaged,
  updateExamResultItem,
  uploadDocument,
  type ExamResultItem,
  type HealthDocument,
} from '../api'
import { errorMessage, healthKeys } from '../constants'
import { ConfirmDialog } from './ConfirmDialog'
import { LoadingState } from './StateViews'
import { resultNumber, TierFit } from './TierFit'

const INTERP_LABEL: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  normal: { label: 'Dentro da faixa', color: 'success' },
  low: { label: 'Abaixo da faixa', color: 'warning' },
  high: { label: 'Acima da faixa', color: 'warning' },
  critical: { label: 'Crítico', color: 'error' },
}

function refRange(min?: number | null, max?: number | null): string {
  if (min != null && max != null) return `${min}–${max}`
  if (max != null) return `< ${max}`
  if (min != null) return `> ${min}`
  return '—'
}

/** Número de um campo editável pt-BR ("1,25"); null se vazio/inválido. */
function fieldNumber(v: string): number | null {
  const t = v.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Extrai o número de um valor com unidade colada ("16 U/L" → 16). */
function looseNumber(v: string): number | null {
  const m = /-?\d+(?:[.,]\d+)?/.exec(v)
  return m ? fieldNumber(m[0]) : null
}

function numToField(v?: number | null): string {
  return v == null ? '' : String(v).replace('.', ',')
}

/**
 * Situação calculada no CLIENTE com a mesma regra do backend: faixa do item
 * ou, na ausência, a curadoria do catálogo; sem faixa alguma → sem situação.
 * Usada para o recálculo em tempo real durante a edição.
 */
function computeInterpretation(
  value: number | null,
  refMin: number | null,
  refMax: number | null,
  fallbackMin?: number | null,
  fallbackMax?: number | null
): string | null {
  let min = refMin
  let max = refMax
  if (min == null && max == null) {
    min = fallbackMin ?? null
    max = fallbackMax ?? null
  }
  if (value == null || (min == null && max == null)) return null
  if (min != null && value < min) return 'low'
  if (max != null && value > max) return 'high'
  return 'normal'
}

type Draft = {
  name: string
  value: string
  unit: string
  refMin: string
  refMax: string
}

function InterpChip({ interp }: { interp: string | null }) {
  const meta = interp ? INTERP_LABEL[interp] : null
  return meta ? (
    <Chip size="small" variant="outlined" color={meta.color} label={meta.label} />
  ) : (
    <Typography variant="caption" color="text.secondary">
      sem faixa aplicável
    </Typography>
  )
}

/**
 * Anexos do resultado: documentos vinculados (laudo importado, radiografias,
 * imagens de ressonância fotografadas) — listar, abrir, enviar e desanexar.
 */
function ResultAttachments({
  resultId,
  familyMemberId,
}: {
  resultId: string
  familyMemberId?: string | null
}) {
  const qc = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [toDetach, setToDetach] = useState<HealthDocument | null>(null)
  const key = ['health', 'result-attachments', resultId] as const

  const { data } = useQuery({
    queryKey: key,
    queryFn: () => listDocumentsPaged({ exam_result_id: resultId, limit: 50 }),
  })
  const docs = data?.items ?? []

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      // Tipo válido no backend (era 'imaging' → "document_type inválido").
      form.append('document_type', 'image_report')
      form.append('exam_result_id', resultId)
      if (familyMemberId) form.append('family_member_id', familyMemberId)
      return uploadDocument(form)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  const detach = useMutation({
    mutationFn: (id: string) => linkDocument(id, null),
    onSuccess: () => {
      setToDetach(null)
      qc.invalidateQueries({ queryKey: key })
    },
  })

  const view = async (id: string) => {
    const { url } = await getDocumentDownloadUrl(id)
    window.open(url, '_blank', 'noopener')
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Anexos ({docs.length})
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<UploadFileRoundedIcon />}
          disabled={upload.isPending}
          onClick={() => fileInput.current?.click()}
        >
          Anexar arquivo
        </Button>
        <input
          ref={fileInput}
          type="file"
          hidden
          accept="application/pdf,image/jpeg,image/png"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload.mutate(f)
            e.target.value = ''
          }}
        />
      </Stack>
      {upload.isError && <Alert severity="error">{errorMessage(upload.error)}</Alert>}
      {docs.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          Nenhum anexo — envie o laudo em PDF ou fotos de radiografia/ressonância.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {docs.map((d) => (
            <Stack
              key={d.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ p: 0.75, border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <Typography variant="body2" noWrap sx={{ flex: 1 }} title={d.original_file_name ?? ''}>
                {d.original_file_name || d.file_name}
              </Typography>
              <Tooltip title="Abrir">
                <IconButton size="small" onClick={() => view(d.id)}>
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Desanexar do exame (o arquivo continua em Documentos)">
                <IconButton size="small" disabled={detach.isPending} onClick={() => setToDetach(d)}>
                  <LinkOffRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      )}
      <ConfirmDialog
        open={Boolean(toDetach)}
        title="Desanexar arquivo"
        description={`Desanexar "${toDetach?.original_file_name ?? 'este arquivo'}" deste exame? O arquivo continua disponível em Documentos.`}
        loading={detach.isPending}
        onConfirm={() => toDetach && detach.mutate(toDetach.id)}
        onClose={() => setToDetach(null)}
      />
    </Box>
  )
}

/**
 * Visualização dos itens de um resultado salvo, com EDIÇÃO INLINE: o lápis
 * abre a linha para editar nome/valor/unidade/faixa — a Situação recalcula em
 * tempo real enquanto digita (mesma regra do backend) e o servidor grava a
 * oficial no salvar.
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
  const qc = useQueryClient()
  const detailKey = [...healthKeys.examResults(), 'detail', resultId] as const
  const { data, isPending, isError, error } = useQuery({
    queryKey: detailKey,
    queryFn: () => getExamResult(resultId),
    enabled: open,
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>({ name: '', value: '', unit: '', refMin: '', refMax: '' })
  const [toDelete, setToDelete] = useState<ExamResultItem | null>(null)

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: detailKey })
    qc.invalidateQueries({ queryKey: healthKeys.examResults() })
    qc.invalidateQueries({ queryKey: healthKeys.dashboard() })
  }

  const saveMutation = useMutation({
    mutationFn: (it: ExamResultItem) =>
      updateExamResultItem(resultId, it.id as string, {
        marker_id: it.marker_id ?? undefined,
        raw_marker_name: it.marker_id
          ? (it.raw_marker_name ?? undefined)
          : draft.name.trim() || undefined,
        result_value: draft.value.trim(),
        unit: draft.unit.trim() || undefined,
        reference_min: fieldNumber(draft.refMin),
        reference_max: fieldNumber(draft.refMax),
        reference_text: it.reference_text ?? undefined,
        method: it.method ?? undefined,
        material: it.material ?? undefined,
        raw_text: it.raw_text ?? undefined,
      }),
    onSuccess: () => {
      setEditingId(null)
      invalidateAll()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (it: ExamResultItem) => deleteExamResultItem(resultId, it.id as string),
    onSuccess: () => {
      setToDelete(null)
      invalidateAll()
    },
  })

  const startEdit = (it: ExamResultItem) => {
    setEditingId(it.id ?? null)
    setDraft({
      name: it.marker_name ?? it.raw_marker_name ?? '',
      value: String(it.result_value ?? ''),
      unit: it.unit ?? '',
      refMin: numToField(it.reference_min),
      refMax: numToField(it.reference_max),
    })
  }

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
            {saveMutation.isError && (
              <Alert severity="error">{errorMessage(saveMutation.error)}</Alert>
            )}
            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 220 }}>Marcador</TableCell>
                    <TableCell sx={{ width: 140 }}>Resultado</TableCell>
                    <TableCell sx={{ width: 100 }}>Unidade</TableCell>
                    <TableCell sx={{ width: 160 }}>Referência</TableCell>
                    <TableCell sx={{ width: 150 }}>Situação</TableCell>
                    <TableCell sx={{ width: 110 }} align="right">
                      Ações
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, idx) => {
                    const editing = editingId != null && editingId === it.id
                    const refInfo = it.reference_text ?? it.marker_ref_text
                    const tiers = it.marker_ref_tiers ?? []
                    // Situação ao vivo: no modo edição usa o rascunho; fora
                    // dele, a oficial calculada pelo servidor.
                    const liveInterp = editing
                      ? computeInterpretation(
                          looseNumber(draft.value),
                          fieldNumber(draft.refMin),
                          fieldNumber(draft.refMax),
                          it.marker_ref_min,
                          it.marker_ref_max
                        )
                      : (it.interpretation_computed ?? null)
                    const num = editing
                      ? looseNumber(draft.value)
                      : resultNumber(it.result_numeric ?? it.result_value)
                    return (
                      <TableRow key={it.id ?? idx} hover selected={editing}>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {editing && !it.marker_id ? (
                                <TextField
                                  variant="standard"
                                  fullWidth
                                  value={draft.name}
                                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                />
                              ) : (
                                <Typography variant="body2" fontWeight={600}>
                                  {it.marker_name ?? it.raw_marker_name ?? '—'}
                                </Typography>
                              )}
                              {refInfo && !editing && (
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
                            {tiers.length > 0 && num != null && !editing && (
                              <TierFit value={num} tiers={tiers} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {editing ? (
                            <TextField
                              variant="standard"
                              fullWidth
                              value={draft.value}
                              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                            />
                          ) : (
                            String(it.result_value)
                          )}
                        </TableCell>
                        <TableCell>
                          {editing ? (
                            <TextField
                              variant="standard"
                              fullWidth
                              value={draft.unit}
                              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                            />
                          ) : (
                            (it.unit ?? '—')
                          )}
                        </TableCell>
                        <TableCell>
                          {editing ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <TextField
                                variant="standard"
                                placeholder="mín"
                                value={draft.refMin}
                                onChange={(e) => setDraft({ ...draft, refMin: e.target.value })}
                                sx={{ width: 64 }}
                              />
                              <Typography variant="caption">–</Typography>
                              <TextField
                                variant="standard"
                                placeholder="máx"
                                value={draft.refMax}
                                onChange={(e) => setDraft({ ...draft, refMax: e.target.value })}
                                sx={{ width: 64 }}
                              />
                            </Stack>
                          ) : (
                            refRange(it.reference_min, it.reference_max)
                          )}
                        </TableCell>
                        <TableCell>
                          <InterpChip interp={liveInterp} />
                        </TableCell>
                        <TableCell align="right">
                          {editing ? (
                            <>
                              <Tooltip title="Salvar">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    disabled={saveMutation.isPending || !draft.value.trim()}
                                    onClick={() => saveMutation.mutate(it)}
                                  >
                                    <CheckRoundedIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Cancelar">
                                <IconButton size="small" onClick={() => setEditingId(null)}>
                                  <CloseRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="Editar item">
                                <IconButton size="small" onClick={() => startEdit(it)}>
                                  <EditRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir item">
                                <IconButton size="small" color="error" onClick={() => setToDelete(it)}>
                                  <DeleteOutlineRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <ResultAttachments resultId={resultId} familyMemberId={data?.family_member_id} />
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir item"
        description={`Excluir "${toDelete?.marker_name ?? toDelete?.raw_marker_name ?? 'este item'}" deste exame? A ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </Dialog>
  )
}
