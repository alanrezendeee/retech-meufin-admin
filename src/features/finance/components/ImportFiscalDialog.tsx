import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
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
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmFiscal,
  formatCents,
  getExtractionStatus,
  listEntries,
  reaisToCents,
  triggerExtraction,
  uploadInvoiceDocument,
  type ConfirmFiscalPayload,
  type ExtractionStatus,
  type FiscalItemSuggestion,
} from '../api'
import { errorMessage, financeKeys } from '../constants'
import { useExpenseCategories } from '../hooks/useExpenseCategories'
import { AutocompleteField } from '@/components/fields/AutocompleteField'
import { MoneyField } from '@/components/fields/MoneyField'
import { formatDateBR } from '@/utils/dates'
import { LoadingState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

const STEPS = ['Enviar arquivo', 'Ler documento', 'Revisar itens', 'Vincular']

const ACCEPTED = 'application/pdf,image/*'

function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Formata quantidade em milésimos: 1000 → "1", 455 → "0,455". */
function formatQty(milli: number): string {
  return (milli / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

type ReviewItem = {
  accepted: boolean
  description: string
  quantity_milli: number
  unit_cents: number
  amount: string // REAIS editável (string da máscara)
  category: string
}

function suggestionToReview(it: FiscalItemSuggestion): ReviewItem {
  return {
    accepted: true,
    description: it.description ?? '',
    quantity_milli: it.quantity_milli || 1000,
    unit_cents: it.unit_cents ?? 0,
    amount: ((it.amount_cents ?? 0) / 100).toFixed(2).replace('.', ','),
    category: it.category ?? '',
  }
}

export function ImportFiscalDialog({
  open,
  onClose,
  onConfirmed,
}: {
  open: boolean
  onClose: () => void
  onConfirmed: (message: string) => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const { activeCategories } = useExpenseCategories()

  const [step, setStep] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [pdfPassword, setPdfPassword] = useState('')

  // Cabeçalho do cupom (revisão)
  const [merchant, setMerchant] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [items, setItems] = useState<ReviewItem[]>([])

  // Vínculo: despesa nova ou existente
  const [linkMode, setLinkMode] = useState<'new' | 'existing'>('new')
  const [entryId, setEntryId] = useState('')
  const [newStatus, setNewStatus] = useState<'prevista' | 'realizada'>('realizada')
  const [newCategory, setNewCategory] = useState('mercado')

  // ---- Passo 1: upload + trigger -----------------------------------------
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo.')
      // Retry (ex.: senha do PDF): reaproveita o documento já enviado.
      let docId = documentId
      if (!docId) {
        const doc = await uploadInvoiceDocument(file, undefined, 'fiscal')
        docId = doc.id
      }
      await triggerExtraction(docId, pdfPassword || undefined)
      return docId
    },
    onSuccess: (docId) => {
      setDocumentId(docId)
      setStep(1)
    },
  })

  // ---- Passo 2: polling ---------------------------------------------------
  const statusQuery = useQuery<ExtractionStatus>({
    queryKey: [...financeKeys.all, 'extraction-status', documentId] as const,
    queryFn: () => getExtractionStatus(documentId as string),
    enabled: step === 1 && Boolean(documentId),
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'pending' || s === 'processing' ? 2500 : false
    },
  })
  const status = statusQuery.data

  const [populatedFor, setPopulatedFor] = useState<string | null>(null)
  if (step === 1 && status?.status === 'completed' && documentId && populatedFor !== documentId) {
    setPopulatedFor(documentId)
    const fiscal = status.fiscal
    setItems((fiscal?.items ?? []).map(suggestionToReview))
    setMerchant(fiscal?.merchant ?? '')
    setPurchaseDate(fiscal?.date || todayIso())
    setStep(2)
  }

  // ---- Passos 3/4 ---------------------------------------------------------
  const acceptedItems = useMemo(() => items.filter((i) => i.accepted), [items])
  const acceptedTotalCents = useMemo(
    () => acceptedItems.reduce((acc, i) => acc + reaisToCents(i.amount), 0),
    [acceptedItems],
  )

  // Despesas candidatas ao vínculo (mês da compra; inclui compras de fatura).
  const linkMonth = useMemo(() => {
    const d = purchaseDate || todayIso()
    return { year: Number(d.slice(0, 4)), month: Number(d.slice(5, 7)) }
  }, [purchaseDate])
  const candidatesQuery = useQuery({
    queryKey: financeKeys.entries({ kind: 'debit', link: 'fiscal', ...linkMonth }),
    queryFn: () =>
      listEntries({ kind: 'debit', year: linkMonth.year, month: linkMonth.month, limit: 500 }),
    enabled: step === 3 && linkMode === 'existing',
  })

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!documentId) throw new Error('Documento inválido.')
      const payload: ConfirmFiscalPayload = {
        items: acceptedItems.map((i) => ({
          description: i.description.trim(),
          quantity_milli: i.quantity_milli,
          unit_cents: i.unit_cents,
          amount_cents: reaisToCents(i.amount),
          category: i.category || null,
        })),
      }
      if (linkMode === 'existing') {
        if (!entryId) throw new Error('Selecione a despesa a vincular.')
        payload.entry_id = entryId
      } else {
        payload.new_entry = {
          description: merchant.trim() || 'Compra (cupom fiscal)',
          amount_cents: acceptedTotalCents,
          due_date: purchaseDate || todayIso(),
          status: newStatus,
          type: newCategory || null,
          purchase_date: purchaseDate || null,
        }
      }
      return confirmFiscal(documentId, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      show(`Cupom vinculado com ${acceptedItems.length} item(ns).`)
      onConfirmed(`Cupom vinculado com ${acceptedItems.length} item(ns).`)
      onClose()
    },
  })

  const setItem = (index: number, patch: Partial<ReviewItem>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))

  const pending = uploadMutation.isPending || confirmMutation.isPending
  const failed = status?.status === 'failed'

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Importar cupom / nota fiscal</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} sx={{ mt: 1, mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ---------------- Passo 1: upload ---------------- */}
        {step === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {uploadMutation.isError && (
              <Alert severity="error">{errorMessage(uploadMutation.error)}</Alert>
            )}
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadFileRoundedIcon />}
              sx={{ py: 3, borderStyle: 'dashed' }}
            >
              {file ? file.name : 'Selecionar PDF ou imagem do cupom/nota'}
              <input
                hidden
                type="file"
                accept={ACCEPTED}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  setDocumentId(null)
                }}
              />
            </Button>
            <TextField
              type="password"
              label="Senha do PDF (se protegido)"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              fullWidth
              helperText="PDFs protegidos com senha são lidos após informar a senha — usada só na leitura, não fica salva."
            />
            <Typography variant="caption" color="text.secondary">
              NFC-e, NF-e, SAT ou cupom de supermercado. Os itens serão extraídos
              automaticamente e vinculados a uma despesa (nova ou existente).
            </Typography>
          </Box>
        )}

        {/* ---------------- Passo 2: leitura ---------------- */}
        {step === 1 && (
          <Box sx={{ py: 3 }}>
            {failed ? (
              <Alert severity="error">
                {status?.error_message || 'Falha na leitura do documento.'}
              </Alert>
            ) : (
              <LoadingState label="Lendo o cupom com IA — isso leva alguns segundos..." />
            )}
          </Box>
        )}

        {/* ---------------- Passo 3: revisar itens ---------------- */}
        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Estabelecimento"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                sx={{ flex: 2, minWidth: 220 }}
              />
              <TextField
                type="date"
                label="Data da compra"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, minWidth: 160 }}
              />
            </Box>
            {(status?.fiscal?.warnings?.length ?? 0) > 0 && (
              <Alert severity="warning" sx={{ py: 0.5 }}>
                {status?.fiscal?.warnings?.join(' • ')}
              </Alert>
            )}
            <TableContainer sx={{ maxHeight: 380 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qtd.</TableCell>
                    <TableCell align="right">Unit.</TableCell>
                    <TableCell sx={{ width: 130 }}>Total</TableCell>
                    <TableCell sx={{ width: 170 }}>Categoria</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={it.accepted}
                          onChange={(e) => setItem(idx, { accepted: e.target.checked })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          variant="standard"
                          fullWidth
                          value={it.description}
                          onChange={(e) => setItem(idx, { description: e.target.value })}
                        />
                      </TableCell>
                      <TableCell align="right">{formatQty(it.quantity_milli)}</TableCell>
                      <TableCell align="right">
                        {it.unit_cents ? formatCents(it.unit_cents) : '—'}
                      </TableCell>
                      <TableCell>
                        <MoneyField
                          variant="standard"
                          value={it.amount}
                          onChange={(e) => setItem(idx, { amount: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          variant="standard"
                          fullWidth
                          value={it.category}
                          onChange={(e) => setItem(idx, { category: e.target.value })}
                        >
                          <MenuItem value="">
                            <em>—</em>
                          </MenuItem>
                          {activeCategories.map((c) => (
                            <MenuItem key={c.slug} value={c.slug}>
                              {c.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: 'right' }}>
              {acceptedItems.length} item(ns) • Total: {formatCents(acceptedTotalCents)}
            </Typography>
          </Box>
        )}

        {/* ---------------- Passo 4: vincular ---------------- */}
        {step === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {confirmMutation.isError && (
              <Alert severity="error">{errorMessage(confirmMutation.error)}</Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              {acceptedItems.length} item(ns) — {formatCents(acceptedTotalCents)}. Vincular a:
            </Typography>
            <RadioGroup value={linkMode} onChange={(e) => setLinkMode(e.target.value as 'new' | 'existing')}>
              <FormControlLabel
                value="new"
                control={<Radio />}
                label="Criar despesa nova (agrupando esta compra)"
              />
              <FormControlLabel
                value="existing"
                control={<Radio />}
                label="Despesa existente (avulsa ou compra dentro de fatura)"
              />
            </RadioGroup>

            {linkMode === 'new' ? (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <AutocompleteField
                  label="Categoria da despesa"
                  value={newCategory}
                  onChange={setNewCategory}
                  options={activeCategories.map((c) => ({ value: c.slug, label: c.name }))}
                />
                <TextField
                  select
                  label="Status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'prevista' | 'realizada')}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="realizada">Realizada (já paga)</MenuItem>
                  <MenuItem value="prevista">Prevista</MenuItem>
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ width: '100%' }}>
                  Descrição: “{merchant.trim() || 'Compra (cupom fiscal)'}” — {formatCents(acceptedTotalCents)} em {formatDateBR(purchaseDate || todayIso())}.
                </Typography>
              </Box>
            ) : (
              <AutocompleteField
                label="Despesa"
                value={entryId}
                onChange={setEntryId}
                options={(candidatesQuery.data?.items ?? []).map((e) => ({
                  value: e.id,
                  label: `${e.description} — ${formatCents(e.amount_cents)}`,
                  description: `${formatDateBR(e.due_date)}${e.parent_id ? ' • compra de fatura' : ''}`,
                }))}
                placeholder="Busque pela descrição da despesa"
              />
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        {step === 0 && (
          <Button
            variant="contained"
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
          >
            Enviar e ler
          </Button>
        )}
        {step === 1 && failed && (
          <Button variant="contained" onClick={() => setStep(0)}>
            Tentar novamente
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="contained"
            onClick={() => setStep(3)}
            disabled={acceptedItems.length === 0}
          >
            Continuar
          </Button>
        )}
        {step === 3 && (
          <Button
            variant="contained"
            color="success"
            onClick={() => confirmMutation.mutate()}
            disabled={
              confirmMutation.isPending ||
              acceptedItems.length === 0 ||
              (linkMode === 'existing' && !entryId)
            }
          >
            Confirmar vínculo
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
