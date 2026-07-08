import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
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
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import UndoRoundedIcon from '@mui/icons-material/UndoRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import CallSplitRoundedIcon from '@mui/icons-material/CallSplitRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  cancelEntry,
  confirmEntry,
  listDiscountReasons,
  reopenEntry,
  createEntry,
  deleteEntry,
  formatCents,
  listEntries,
  listFamilyMembers,
  listSuppliers,
  reaisToCents,
  updateEntry,
  type ConfirmEntryPayload,
  type Entry,
  type EntryInput,
  type ListEntriesParams,
} from '../api'
import {
  ENTRY_STATUS_COLOR,
  ENTRY_STATUS_LABEL,
  ENTRY_STATUS_OPTIONS,
  errorMessage,
  financeKeys,
  MONTH_OPTIONS,
  RECURRENCE_LABEL,
  RECURRENCE_OPTIONS,
  yearOptions,
} from '../constants'
import { MoneyField } from '@/components/fields/MoneyField'
import {
  createExpenseCategory,
  type ExpenseCategory,
  type ExpenseGroup,
} from '../api'
import { useExpenseCategories } from '../hooks/useExpenseCategories'
import { AutocompleteField } from '@/components/fields/AutocompleteField'
import { formatDateBR } from '@/utils/dates'
import { TablePaginationBR } from '@/components/tables/TablePaginationBR'
import { PageHeader } from '@/features/health/components/PageHeader'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

const now = new Date()

type Filters = {
  family_member_id: string
  year: number
  month: number
  status: string
  type: string
}

const initialFilters: Filters = {
  family_member_id: '',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  status: '',
  type: '',
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, color, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

type EntryFormValues = {
  family_member_id: string
  supplier_id: string
  type: string
  amount: string // reais
  due_date: string
  recurrence: EntryInput['recurrence']
  installments: boolean
  installments_count: string
  confirm_past: boolean
  description: string
  notes: string
}

function emptyEntryForm(): EntryFormValues {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return {
    family_member_id: '',
    supplier_id: '',
    type: 'moradia',
    amount: '',
    due_date: `${y}-${m}-${d}`,
    recurrence: 'none',
    installments: false,
    installments_count: '2',
    confirm_past: false,
    description: '',
    notes: '',
  }
}

// ---------------------------------------------------------------------------
// Entry form dialog
// ---------------------------------------------------------------------------


function QuickCategoryForm({
  groups,
  onCreated,
  onCancel,
}: {
  groups: ExpenseGroup[]
  onCreated: (category: ExpenseCategory) => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const { control, handleSubmit } = useForm<{ name: string; group_slug: string }>({
    defaultValues: { name: '', group_slug: 'outros' },
  })

  const mutation = useMutation({
    mutationFn: (values: { name: string; group_slug: string }) =>
      createExpenseCategory({ name: values.name.trim(), group_slug: values.group_slug }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: financeKeys.expenseCategories() })
      onCreated(created)
    },
  })

  const submit = handleSubmit((values) => {
    if (!values.name.trim()) return
    mutation.mutate(values)
  })

  return (
    <Box
      sx={{ p: 2, borderRadius: 1, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Criar categoria rápida
      </Typography>
      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {errorMessage(mutation.error)}
        </Alert>
      )}
      <Stack spacing={1.5}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Nome" size="small" fullWidth placeholder="Ex.: Pets" />
          )}
        />
        <Controller
          name="group_slug"
          control={control}
          render={({ field }) => (
            <AutocompleteField
              label="Grupo (indicadores)"
              size="small"
              value={field.value}
              onChange={field.onChange}
              options={groups.map((g) => ({
                value: g.slug,
                label: g.name,
                description: g.description,
              }))}
              placeholder="Busque por nome ou exemplo (ex.: cinema)"
            />
          )}
        />
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" color="inherit" onClick={onCancel} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button size="small" variant="contained" onClick={submit} disabled={mutation.isPending}>
            Criar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Dialog: confirmar pagamento (com desconto opcional)
// ---------------------------------------------------------------------------

function ConfirmPaymentDialog({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [discountText, setDiscountText] = useState('')
  const [reason, setReason] = useState('')
  const [paidText, setPaidText] = useState('')
  const [residualDate, setResidualDate] = useState(entry.due_date)

  const reasonsQuery = useQuery({
    queryKey: financeKeys.discountReasons(),
    queryFn: listDiscountReasons,
  })

  const discountCents = reaisToCents(discountText)
  const expectedCents = entry.amount_cents - discountCents
  const paidCents = reaisToCents(paidText)
  const paidProvided = paidCents > 0
  const residualCents = paidProvided ? expectedCents - paidCents : 0

  const discountInvalid =
    discountCents > 0 && (discountCents >= entry.amount_cents || !reason)
  const paidInvalid = paidProvided && paidCents > expectedCents
  // Entry.type é IncomeType no modelo, mas em débitos carrega o slug da
  // categoria de despesa ('cartao' identifica fatura).
  const isInvoice = (entry.type as string | null | undefined) === 'cartao'
  const partialBlocked = residualCents > 0 && isInvoice

  const mutation = useMutation({
    mutationFn: () => {
      const payload: ConfirmEntryPayload = {}
      if (discountCents > 0) {
        payload.discount_cents = discountCents
        payload.discount_reason = reason
      }
      if (paidProvided && paidCents < expectedCents) {
        payload.paid_amount_cents = paidCents
        if (residualDate && residualDate !== entry.due_date) {
          payload.residual_due_date = residualDate
        }
      }
      return confirmEntry(entry.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      if (residualCents > 0) {
        show(`Pagamento parcial confirmado. Residual de ${formatCents(residualCents)} criado.`)
      } else if (discountCents > 0) {
        show(`Pagamento confirmado com ${formatCents(discountCents)} de desconto.`)
      } else {
        show('Despesa confirmada como paga.')
      }
      onClose()
    },
  })

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Confirmar pagamento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <Typography variant="body2" color="text.secondary">
            {entry.description} — {formatCents(entry.amount_cents)}
          </Typography>
          <MoneyField
            label="Desconto (opcional)"
            value={discountText}
            onChange={(e) => setDiscountText(e.target.value)}
            fullWidth
            error={discountCents > 0 && discountCents >= entry.amount_cents}
            helperText={
              discountCents > 0 && discountCents >= entry.amount_cents
                ? 'Desconto não pode ser maior ou igual ao valor da despesa'
                : undefined
            }
          />
          {discountCents > 0 && (
            <AutocompleteField
              label="Motivo do desconto"
              value={reason}
              onChange={setReason}
              options={(reasonsQuery.data ?? []).map((r) => ({
                value: r.slug,
                label: r.name,
                description: r.description,
              }))}
              placeholder="Ex.: pagamento antecipado"
            />
          )}
          <MoneyField
            label="Valor pago (opcional)"
            value={paidText}
            onChange={(e) => setPaidText(e.target.value)}
            fullWidth
            error={paidInvalid}
            helperText={
              paidInvalid
                ? `Valor pago não pode ser maior que o devido (${formatCents(expectedCents)})`
                : `Vazio = pagamento integral de ${formatCents(expectedCents)}`
            }
          />
          {residualCents > 0 && !isInvoice && (
            <>
              <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
                Pagamento parcial: um lançamento residual de{' '}
                <strong>{formatCents(residualCents)}</strong> será criado.
              </Alert>
              <TextField
                type="date"
                label="Vencimento do residual"
                value={residualDate}
                onChange={(e) => setResidualDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Data original = residual nasce vencido; data futura = renegociado"
              />
            </>
          )}
          {partialBlocked && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Pagamento parcial de fatura de cartão ainda não é suportado.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || discountInvalid || paidInvalid || partialBlocked}
        >
          Confirmar pagamento
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function EntryFormDialog({
  open,
  entry,
  onClose,
  onCreatedRecurring,
}: {
  open: boolean
  entry: Entry | null
  onClose: () => void
  onCreatedRecurring: (count: number) => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const isEdit = Boolean(entry)

  const membersQuery = useQuery({
    queryKey: financeKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })
  const suppliersQuery = useQuery({
    queryKey: financeKeys.suppliers(),
    queryFn: listSuppliers,
  })
  const { activeCategories, groups } = useExpenseCategories()
  const [quickCategory, setQuickCategory] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EntryFormValues>({
    values: entry
      ? {
          family_member_id: entry.family_member_id ?? '',
          supplier_id: entry.supplier_id ?? '',
          type: entry.type ?? 'moradia',
          amount: (entry.amount_cents / 100).toFixed(2).replace('.', ','),
          due_date: entry.due_date,
          recurrence: entry.recurrence,
          installments: false,
          installments_count: '2',
          confirm_past: false,
          description: entry.description,
          notes: entry.notes ?? '',
        }
      : emptyEntryForm(),
  })

  const recurrence = useWatch({ control, name: 'recurrence' })
  const installments = useWatch({ control, name: 'installments' })
  const amountText = useWatch({ control, name: 'amount' })
  const installmentsCount = useWatch({ control, name: 'installments_count' })
  const dueDateText = useWatch({ control, name: 'due_date' })

  // "15× de R$ 1.500,00 = R$ 22.500,00 no total" — mata a ambiguidade
  // parcela × total na origem.
  const installmentsSummary = useMemo(() => {
    const n = Math.trunc(Number(installmentsCount))
    const per = reaisToCents(amountText ?? '')
    if (!installments || !Number.isFinite(n) || n < 2 || per <= 0) return ''
    return `${n}× de ${formatCents(per)} = ${formatCents(per * n)} no total.`
  }, [installments, installmentsCount, amountText])

  const isPastDate = useMemo(() => {
    if (!dueDateText) return false
    return dueDateText < new Date().toISOString().slice(0, 10)
  }, [dueDateText])

  const mutation = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      const base: EntryInput = {
        kind: 'debit',
        status: entry?.status ?? 'prevista',
        amount_cents: reaisToCents(values.amount),
        due_date: values.due_date,
        family_member_id: values.family_member_id || null,
        source_id: null,
        type: (values.type || null) as EntryInput['type'],
        description: values.description.trim(),
        recurrence: values.installments ? 'none' : values.recurrence,
        notes: values.notes.trim() || null,
        supplier_id: values.supplier_id || null,
      }
      if (!isEdit && values.installments) {
        const n = Number(values.installments_count)
        base.installments_total = Number.isFinite(n) && n >= 2 ? Math.trunc(n) : 2
      }
      if (!isEdit && values.confirm_past) {
        base.confirm_past_occurrences = true
      }
      if (isEdit) {
        await updateEntry(entry!.id, base)
        return { created: 0 }
      }
      const res = await createEntry(base)
      return { created: res.total ?? res.items?.length ?? 1 }
    },
    onSuccess: ({ created }) => {
      if (isEdit) {
        show('Despesa atualizada com sucesso.')
      } else if (created <= 1) {
        show('Despesa criada com sucesso.')
      }
      qc.invalidateQueries({ queryKey: financeKeys.all })
      reset(emptyEntryForm())
      onClose()
      if (!isEdit && created > 1) onCreatedRecurring(created)
    },
  })

  const submit = handleSubmit((values) => mutation.mutate(values))

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar despesa' : 'Nova despesa'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="family_member_id"
              control={control}
              render={({ field }) => (
                <AutocompleteField
                  label="Membro da família"
                  emptyLabel="Não atribuído"
                  value={field.value}
                  onChange={field.onChange}
                  options={(membersQuery.data ?? []).map((m) => ({
                    value: m.id,
                    label: m.full_name,
                  }))}
                />
              )}
            />
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <AutocompleteField
                  label="Fornecedor"
                  emptyLabel="Nenhum"
                  value={field.value}
                  onChange={field.onChange}
                  options={(suppliersQuery.data ?? []).map((s) => ({
                    value: s.id,
                    label: s.name,
                    description: s.category,
                  }))}
                  placeholder="Busque por nome…"
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Stack spacing={1} sx={{ width: '100%' }}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => {
                  const selected = activeCategories.find((c) => c.slug === field.value)
                  return (
                    <AutocompleteField
                      label="Categoria"
                      value={field.value}
                      onChange={field.onChange}
                      options={activeCategories.map((cat) => ({
                        value: cat.slug,
                        label: cat.name,
                        description: cat.group_name,
                        keywords: groups.find((g) => g.slug === cat.group_slug)?.description,
                      }))}
                      placeholder="Busque por nome, grupo ou exemplo"
                      helperText={
                        selected ? `Grupo: ${selected.group_name} (indicadores)` : undefined
                      }
                    />
                  )
                }}
              />
              {quickCategory ? (
                <QuickCategoryForm
                  groups={groups}
                  onCreated={(created) => {
                    setValue('type', created.slug)
                    setQuickCategory(false)
                  }}
                  onCancel={() => setQuickCategory(false)}
                />
              ) : (
                <Button
                  size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setQuickCategory(true)}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Criar categoria rápida
                </Button>
              )}
            </Stack>
            <Controller
              name="amount"
              control={control}
              rules={{
                required: 'Informe o valor',
                validate: (v) => reaisToCents(v) > 0 || 'Valor deve ser maior que zero',
              }}
              render={({ field }) => (
                <MoneyField
                  {...field}
                  label={installments ? 'Valor da parcela' : 'Valor'}
                  fullWidth
                  required
                  error={Boolean(errors.amount)}
                  helperText={
                    errors.amount?.message ??
                    (installments ? 'Valor de CADA parcela, não o total' : undefined)
                  }
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="due_date"
              control={control}
              rules={{ required: 'Informe a data' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Data"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.due_date)}
                  helperText={errors.due_date?.message}
                />
              )}
            />
            <Controller
              name="recurrence"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Recorrência"
                  fullWidth
                  disabled={isEdit || installments}
                >
                  {RECURRENCE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          {!isEdit && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Controller
                name="installments"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    sx={{ flexShrink: 0 }}
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Parcelado"
                  />
                )}
              />
              {installments && (
                <Controller
                  name="installments_count"
                  control={control}
                  rules={{
                    validate: (v) =>
                      !installments ||
                      Number(v) >= 2 ||
                      'Informe ao menos 2 parcelas',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="number"
                      label="Número de parcelas"
                      fullWidth
                      inputProps={{ min: 2 }}
                      error={Boolean(errors.installments_count)}
                      helperText={errors.installments_count?.message}
                    />
                  )}
                />
              )}
            </Stack>
          )}

          {!isEdit && installments && (
            <Alert severity="info" icon={<RepeatRoundedIcon />}>
              Ao salvar, o sistema gera as <strong>parcelas mensais</strong> previstas (X/N).
              {installmentsSummary && (
                <>
                  {' '}
                  <strong>{installmentsSummary}</strong>
                </>
              )}
            </Alert>
          )}

          {!isEdit && !installments && recurrence !== 'none' && (
            <Alert severity="info" icon={<RepeatRoundedIcon />}>
              Ao salvar, o sistema gera os lançamentos <strong>previstos</strong> dos próximos 12
              meses — e mantém sempre 1 ano à frente. Para encerrar a recorrência, cancele a
              ocorrência mais recente.
            </Alert>
          )}

          {!isEdit && (installments || recurrence !== 'none') && isPastDate && (
            <Controller
              name="confirm_past"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Parcelas/lançamentos já vencidos foram pagos (nascem como realizados)"
                />
              )}
            />
          )}

          <Controller
            name="description"
            control={control}
            rules={{ required: 'Informe uma descrição' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Descrição"
                fullWidth
                required
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Observações" fullWidth multiline minRows={2} />
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button onClick={submit} variant="contained" disabled={mutation.isPending}>
          {isEdit ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DespesasPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [toDelete, setToDelete] = useState<Entry | null>(null)
  const [toCancel, setToCancel] = useState<Entry | null>(null)
  const [toReopen, setToReopen] = useState<Entry | null>(null)
  const [toConfirm, setToConfirm] = useState<Entry | null>(null)

  const membersQuery = useQuery({
    queryKey: financeKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })
  const suppliersListQuery = useQuery({
    queryKey: financeKeys.suppliers(),
    queryFn: listSuppliers,
  })
  const discountReasonsQuery = useQuery({
    queryKey: financeKeys.discountReasons(),
    queryFn: listDiscountReasons,
  })
  const { activeCategories, labelOf } = useExpenseCategories()

  const listParams: ListEntriesParams = useMemo(() => {
    const p: ListEntriesParams = {
      kind: 'debit',
      year: filters.year,
      month: filters.month,
      limit: pageSize,
      offset: page * pageSize,
    }
    if (filters.family_member_id) p.family_member_id = filters.family_member_id
    if (filters.status) p.status = filters.status as ListEntriesParams['status']
    if (filters.type) p.type = filters.type as ListEntriesParams['type']
    if (query.trim()) p.query = query.trim()
    return p
  }, [filters, query, page, pageSize])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: financeKeys.entries(listParams as Record<string, unknown>),
    queryFn: () => listEntries(listParams),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setToDelete(null)
      show('Despesa excluída.')
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setToCancel(null)
      show('Despesa cancelada.')
    },
  })
  const reopenMutation = useMutation({
    mutationFn: (id: string) => reopenEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setToReopen(null)
      show('Pagamento desfeito. Despesa voltou a prevista.')
    },
  })

  const entries = useMemo(() => data?.items ?? [], [data])

  const memberName = (id?: string | null) =>
    (membersQuery.data ?? []).find((m) => m.id === id)?.full_name ?? '—'
  const categoryName = (value?: string | null) => labelOf(value)
  const supplierName = (id?: string | null) =>
    (suppliersListQuery.data ?? []).find((s) => s.id === id)?.name ?? null
  const discountReasonName = (slug?: string | null) =>
    (discountReasonsQuery.data ?? []).find((r) => r.slug === slug)?.name ?? slug ?? '—'

  const stats = useMemo(() => {
    let previsto = 0
    let realizado = 0
    let countPrevista = 0
    let countRealizada = 0
    for (const e of entries) {
      if (e.status === 'prevista') {
        previsto += e.amount_cents
        countPrevista += 1
      } else if (e.status === 'realizada') {
        realizado += e.amount_cents
        countRealizada += 1
      }
    }
    return { previsto, realizado, countPrevista, countRealizada }
  }, [entries])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (e: Entry) => {
    setEditing(e)
    setFormOpen(true)
  }

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setPage(0) // filtro mudou: resultado novo começa da primeira página
    setFilters((f) => ({ ...f, [key]: value }))
  }

  return (
    <>
      <PageHeader
        title="Despesas"
        subtitle="Lance as despesas da família. Recorrentes viram previstas do ano; confirmar marca como paga."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Nova despesa
          </Button>
        }
      />

      {/* Cards de resumo */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Previsto no mês"
            value={formatCents(stats.previsto)}
            color="warning.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Realizado no mês"
            value={formatCents(stats.realizado)}
            color="error.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Previstas" value={String(stats.countPrevista)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard label="Realizadas" value={String(stats.countRealizada)} />
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Buscar por descrição…"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                label="Membro"
                fullWidth
                size="small"
                value={filters.family_member_id}
                onChange={(e) => setFilter('family_member_id', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {(membersQuery.data ?? []).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.full_name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                select
                label="Mês"
                fullWidth
                size="small"
                value={filters.month}
                onChange={(e) => setFilter('month', Number(e.target.value))}
              >
                {MONTH_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                select
                label="Ano"
                fullWidth
                size="small"
                value={filters.year}
                onChange={(e) => setFilter('year', Number(e.target.value))}
              >
                {yearOptions().map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 2 }}>
              <TextField
                select
                label="Status"
                fullWidth
                size="small"
                value={filters.status}
                onChange={(e) => setFilter('status', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {ENTRY_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 6, md: 3 }}>
              <AutocompleteField
                label="Categoria"
                size="small"
                emptyLabel="Todas"
                value={filters.type}
                onChange={(v) => setFilter('type', v)}
                options={activeCategories.map((cat) => ({
                  value: cat.slug,
                  label: cat.name,
                  description: cat.group_name,
                }))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<TrendingDownRoundedIcon />}
          title="Nenhuma despesa no período"
          description="Ajuste os filtros ou lance uma nova despesa para começar."
          action={
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Nova despesa
            </Button>
          }
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Membro</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Fornecedor</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Recorrência</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{formatDateBR(e.due_date)}</TableCell>
                    <TableCell>{memberName(e.family_member_id)}</TableCell>
                    <TableCell>{categoryName(e.type)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {supplierName(e.supplier_id) ?? '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCents(e.amount_cents)}
                      {e.discount_cents ? (
                        <Tooltip
                          title={`Desconto: ${discountReasonName(e.discount_reason)} — pago ${formatCents(e.paid_amount_cents ?? e.amount_cents - e.discount_cents)}`}
                        >
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ color: 'success.main', fontWeight: 600 }}
                          >
                            −{formatCents(e.discount_cents)}
                          </Typography>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {e.residual_of_id ? (
                        <Tooltip title="Saldo não pago de um pagamento parcial">
                          <Chip
                            size="small"
                            variant="outlined"
                            color="warning"
                            icon={<CallSplitRoundedIcon />}
                            label="Residual"
                          />
                        </Tooltip>
                      ) : e.installment_total ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${e.installment_number ?? '?'}/${e.installment_total}`}
                        />
                      ) : e.recurrence !== 'none' ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<RepeatRoundedIcon />}
                          label={RECURRENCE_LABEL[e.recurrence] ?? e.recurrence}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={ENTRY_STATUS_LABEL[e.status] ?? e.status}
                        color={ENTRY_STATUS_COLOR[e.status] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {e.status === 'prevista' && (
                        <Tooltip title="Confirmar pagamento">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => setToConfirm(e)}
                          >
                            <CheckCircleRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {e.status === 'realizada' && (
                        <Tooltip title="Desfazer pagamento">
                          <IconButton
                            size="small"
                            color="warning"
                            disabled={reopenMutation.isPending}
                            onClick={() => setToReopen(e)}
                          >
                            <UndoRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(e)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {e.status !== 'cancelada' && (
                        <Tooltip title="Cancelar">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setToCancel(e)}
                          >
                            <CancelRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setToDelete(e)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <TablePaginationBR
            total={data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}

      {formOpen && (
        <EntryFormDialog
          open={formOpen}
          entry={editing}
          onClose={() => setFormOpen(false)}
          onCreatedRecurring={(count) =>
            show(`${count} lançamentos previstos criados até dezembro.`)
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir despesa"
        description={`Excluir "${toDelete?.description}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancelar despesa"
        description={`Marcar "${toCancel?.description}" como cancelada?`}
        confirmLabel="Cancelar despesa"
        cancelLabel="Voltar"
        loading={cancelMutation.isPending}
        onConfirm={() => toCancel && cancelMutation.mutate(toCancel.id)}
        onClose={() => setToCancel(null)}
      />

      {toConfirm && (
        <ConfirmPaymentDialog entry={toConfirm} onClose={() => setToConfirm(null)} />
      )}

      <ConfirmDialog
        open={Boolean(toReopen)}
        title="Desfazer pagamento"
        description={`Desfazer o pagamento de "${toReopen?.description}"? A despesa volta a prevista e os dados de pagamento são limpos.`}
        confirmLabel="Desfazer pagamento"
        cancelLabel="Voltar"
        loading={reopenMutation.isPending}
        onConfirm={() => toReopen && reopenMutation.mutate(toReopen.id)}
        onClose={() => setToReopen(null)}
      />
    </>
  )
}
