import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRenegotiation,
  formatCents,
  getRenegotiationPreview,
  reaisToCents,
  type ChargeStatus,
  type OpenCharge,
  type RenegotiationPreview,
} from '../api'
import { errorMessage, financeKeys } from '../constants'
import { MoneyField } from '@/components/fields/MoneyField'
import { ErrorState, LoadingState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

const STEPS = ['Saldo devedor', 'Novo acordo', 'Confirmar']

type ChargeFilter = 'all' | 'open' | 'residual' | 'paid'

const STATUS_CHIP: Record<
  ChargeStatus,
  { label: string; color: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  paid: { label: 'Quitada', color: 'success' },
  partially_paid: { label: 'Paga parcial', color: 'info' },
  overdue: { label: 'Atrasada', color: 'error' },
  upcoming: { label: 'A vencer', color: 'default' },
}

function chargeLabel(c: OpenCharge): string {
  if (c.kind === 'residual') {
    return c.installment_number ? `Saldo da parcela ${c.installment_number}` : c.description
  }
  return c.installment_number ? `Parcela ${c.installment_number}` : c.description
}

function matchesFilter(c: OpenCharge, f: ChargeFilter): boolean {
  switch (f) {
    case 'open':
      return c.included // atrasadas + a vencer (o que entra no acordo)
    case 'residual':
      return c.kind === 'residual'
    case 'paid':
      return c.status === 'paid' || c.status === 'partially_paid'
    default:
      return true
  }
}

function formatDateBR(iso: string): string {
  if (!iso || iso.length < 10) return iso
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/**
 * Renegociação de dívida parcelada (novação).
 *
 * O passo 1 é o que faz a tela valer sozinha: apura quanto ainda se deve,
 * somando as parcelas em aberto e os residuais de pagamentos parciais. É uma
 * conta que o usuário não tem como fazer de cabeça e erraria no papel — e é
 * justamente o número que ele leva para a negociação.
 */
export function RenegotiateDialog({
  groupId,
  onClose,
}: {
  groupId: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()

  const [step, setStep] = useState(0)
  const [countText, setCountText] = useState('')
  const [amountText, setAmountText] = useState('')
  const [firstDue, setFirstDue] = useState('')
  const [notes, setNotes] = useState('')
  const [filter, setFilter] = useState<ChargeFilter>('all')

  const previewQuery = useQuery<RenegotiationPreview>({
    queryKey: financeKeys.renegotiationPreview(groupId),
    queryFn: () => getRenegotiationPreview(groupId),
  })
  const preview = previewQuery.data

  // Sugere o primeiro vencimento assim que a apuração chega (sem efeito:
  // ajuste de estado durante o render, guardado pelo próprio valor).
  const [seededFor, setSeededFor] = useState<string | null>(null)
  if (preview && seededFor !== groupId) {
    setSeededFor(groupId)
    setFirstDue(preview.suggested_due_date)
  }

  const count = Math.trunc(Number(countText)) || 0
  const installmentCents = reaisToCents(amountText)
  const newTotalCents = count * installmentCents
  const openTotal = preview?.open_total_cents ?? 0
  const adjustment = newTotalCents - openTotal

  const canAdvance = count > 0 && installmentCents > 0 && Boolean(firstDue)

  const mutation = useMutation({
    mutationFn: () =>
      createRenegotiation({
        group_id: groupId,
        installment_count: count,
        installment_cents: installmentCents,
        first_due_date: firstDue,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      show(
        `Dívida renegociada: ${res.renegotiation.origin_count} cobranças encerradas, ` +
          `${res.renegotiation.new_count} parcelas criadas.`
      )
      onClose()
    },
  })

  const chargesSorted = useMemo(() => {
    const all = [...(preview?.charges ?? [])].sort((a, b) => {
      const na = a.installment_number ?? 0
      const nb = b.installment_number ?? 0
      // Residual logo depois da parcela que o originou.
      if (na !== nb) return na - nb
      if (a.kind !== b.kind) return a.kind === 'residual' ? 1 : -1
      return a.due_date.localeCompare(b.due_date)
    })
    return all.filter((c) => matchesFilter(c, filter))
  }, [preview, filter])

  const filterCounts = useMemo(() => {
    const all = preview?.charges ?? []
    return {
      all: all.length,
      open: all.filter((c) => matchesFilter(c, 'open')).length,
      residual: all.filter((c) => matchesFilter(c, 'residual')).length,
      paid: all.filter((c) => matchesFilter(c, 'paid')).length,
    }
  }, [preview])

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Renegociar dívida</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mt: 1, mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {previewQuery.isLoading && <LoadingState label="Apurando o saldo devedor…" />}
        {previewQuery.isError && <ErrorState message={errorMessage(previewQuery.error)} />}

        {preview && (
          <>
            {/* -------- Passo 1: saldo apurado -------- */}
            {step === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {preview.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Já pago
                    </Typography>
                    <Typography variant="h6">{formatCents(preview.paid_cents)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {preview.paid_count} de {preview.installment_total} parcelas
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Saldo em aberto
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {formatCents(preview.open_total_cents)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {preview.installment_count + preview.residual_count} cobranças
                      {preview.overdue_count > 0 &&
                        ` — ${preview.overdue_count} atrasada(s) (${formatCents(preview.overdue_cents)})`}
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ py: 0.5 }}>
                  {preview.installment_count} parcelas em aberto (
                  {formatCents(preview.installment_cents)})
                  {preview.residual_count > 0 && (
                    <>
                      {' '}
                      + {preview.residual_count} residuais de pagamentos parciais (
                      {formatCents(preview.residual_cents)})
                    </>
                  )}
                  . As parcelas já pagas não entram — o que faltou delas já está nos residuais.
                </Alert>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(
                    [
                      ['all', `Todas (${filterCounts.all})`],
                      ['open', `Atrasadas e a vencer (${filterCounts.open})`],
                      ['residual', `Residuais (${filterCounts.residual})`],
                      ['paid', `Pagas (${filterCounts.paid})`],
                    ] as [ChargeFilter, string][]
                  ).map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      size="small"
                      color={filter === value ? 'primary' : 'default'}
                      variant={filter === value ? 'filled' : 'outlined'}
                      onClick={() => setFilter(value)}
                    />
                  ))}
                </Box>

                <TableContainer
                  sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 300 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 60 }} align="right">
                          Nº
                        </TableCell>
                        <TableCell>Cobrança</TableCell>
                        <TableCell sx={{ width: 130 }}>Status</TableCell>
                        <TableCell sx={{ width: 120 }}>Vencimento</TableCell>
                        <TableCell sx={{ width: 140 }} align="right">
                          Valor
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {chargesSorted.map((c) => {
                        const chip = STATUS_CHIP[c.status]
                        return (
                          <TableRow
                            key={c.id}
                            hover
                            // Pagas são contexto: esmaecidas, fora do acordo.
                            sx={c.included ? undefined : { opacity: 0.55 }}
                          >
                            <TableCell align="right">{c.installment_number ?? '—'}</TableCell>
                            <TableCell>{chargeLabel(c)}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                variant="outlined"
                                color={c.kind === 'residual' ? 'warning' : chip.color}
                                label={c.kind === 'residual' ? 'Residual' : chip.label}
                              />
                            </TableCell>
                            <TableCell>{formatDateBR(c.due_date)}</TableCell>
                            <TableCell align="right">
                              {c.status === 'partially_paid' && c.paid_amount_cents != null ? (
                                <>
                                  {formatCents(c.paid_amount_cents)}
                                  <Typography
                                    variant="caption"
                                    display="block"
                                    color="text.secondary"
                                  >
                                    de {formatCents(c.amount_cents)}
                                  </Typography>
                                </>
                              ) : (
                                formatCents(c.amount_cents)
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* -------- Passo 2: novo acordo -------- */}
            {step === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Saldo a repactuar: <strong>{formatCents(openTotal)}</strong>
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    type="number"
                    label="Quantidade de parcelas"
                    value={countText}
                    onChange={(e) => setCountText(e.target.value)}
                    inputProps={{ min: 1 }}
                    sx={{ minWidth: 180 }}
                  />
                  <MoneyField
                    label="Valor da parcela"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    sx={{ minWidth: 180 }}
                  />
                  <TextField
                    type="date"
                    label="1º vencimento"
                    value={firstDue}
                    onChange={(e) => setFirstDue(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 180 }}
                  />
                </Box>

                <TextField
                  label="Observações (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                />

                {newTotalCents > 0 && (
                  <Alert severity={adjustment > 0 ? 'warning' : adjustment < 0 ? 'success' : 'info'}>
                    Novo total: <strong>{formatCents(newTotalCents)}</strong>
                    {adjustment > 0 && (
                      <>
                        {' '}
                        — <strong>{formatCents(adjustment)}</strong> acima do saldo (encargos da
                        renegociação).
                      </>
                    )}
                    {adjustment < 0 && (
                      <>
                        {' '}
                        — <strong>{formatCents(-adjustment)}</strong> de desconto sobre o saldo.
                      </>
                    )}
                    {adjustment === 0 && ' — igual ao saldo, sem juros nem desconto.'}
                  </Alert>
                )}
              </Box>
            )}

            {/* -------- Passo 3: confirmação -------- */}
            {step === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Confira antes de aplicar
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="body2">
                    <strong>
                      {preview.installment_count + preview.residual_count} cobranças
                    </strong>{' '}
                    em aberto serão encerradas ({formatCents(openTotal)}).
                  </Typography>
                  <Typography variant="body2">
                    <strong>
                      {count}× {formatCents(installmentCents)}
                    </strong>{' '}
                    serão criadas a partir de {formatDateBR(firstDue)} ({formatCents(newTotalCents)}
                    ).
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    As {preview.paid_count} parcelas já pagas permanecem intactas no histórico.
                  </Typography>
                </Box>

                <Divider />

                <Alert severity="info" sx={{ py: 0.5 }}>
                  As cobranças encerradas continuam consultáveis e ficam ligadas ao novo acordo, de
                  modo que a dívida repactuada não é contada duas vezes nos relatórios.
                </Alert>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancelar
        </Button>
        {step > 0 && (
          <Button onClick={() => setStep(step - 1)} disabled={mutation.isPending}>
            Voltar
          </Button>
        )}
        {step === 0 && (
          <Button
            variant="contained"
            onClick={() => setStep(1)}
            disabled={!preview || preview.installment_count + preview.residual_count === 0}
          >
            Continuar
          </Button>
        )}
        {step === 1 && (
          <Button variant="contained" onClick={() => setStep(2)} disabled={!canAdvance}>
            Revisar
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Aplicar renegociação
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
