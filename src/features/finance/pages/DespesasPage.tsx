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
  MenuItem,
  Snackbar,
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
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  cancelEntry,
  confirmEntry,
  createEntry,
  deleteEntry,
  formatCents,
  listEntries,
  listFamilyMembers,
  reaisToCents,
  updateEntry,
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
import { PageHeader } from '@/features/health/components/PageHeader'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'

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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
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
            <TextField
              {...field}
              select
              label="Grupo (indicadores)"
              size="small"
              sx={{ minWidth: 190 }}
            >
              {groups.map((g) => (
                <MenuItem key={g.slug} value={g.slug}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" onClick={submit} disabled={mutation.isPending}>
            Criar
          </Button>
          <Button size="small" color="inherit" onClick={onCancel} disabled={mutation.isPending}>
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Box>
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
  const isEdit = Boolean(entry)

  const membersQuery = useQuery({
    queryKey: financeKeys.familyMembers(),
    queryFn: listFamilyMembers,
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

          <Controller
            name="family_member_id"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Membro da família" fullWidth>
                <MenuItem value="">
                  <em>Não atribuído</em>
                </MenuItem>
                {(membersQuery.data ?? []).map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.full_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Stack spacing={1} sx={{ width: '100%' }}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => {
                  const selected = activeCategories.find((c) => c.slug === field.value)
                  return (
                    <TextField
                      {...field}
                      select
                      label="Categoria"
                      fullWidth
                      helperText={
                        selected ? `Grupo: ${selected.group_name} (indicadores)` : undefined
                      }
                    >
                      {activeCategories.map((cat) => (
                        <MenuItem key={cat.slug} value={cat.slug}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ width: '100%' }}
                          >
                            <span>{cat.name}</span>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                              {cat.group_name}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </TextField>
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
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Entry | null>(null)
  const [toDelete, setToDelete] = useState<Entry | null>(null)
  const [toCancel, setToCancel] = useState<Entry | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: financeKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })
  const { activeCategories, labelOf } = useExpenseCategories()

  const listParams: ListEntriesParams = useMemo(() => {
    const p: ListEntriesParams = {
      kind: 'debit',
      year: filters.year,
      month: filters.month,
      limit: 500,
    }
    if (filters.family_member_id) p.family_member_id = filters.family_member_id
    if (filters.status) p.status = filters.status as ListEntriesParams['status']
    if (filters.type) p.type = filters.type as ListEntriesParams['type']
    return p
  }, [filters])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: financeKeys.entries(listParams as Record<string, unknown>),
    queryFn: () => listEntries(listParams),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setToast('Despesa confirmada como paga.')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setToDelete(null)
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setToCancel(null)
    },
  })

  const entries = useMemo(() => data?.items ?? [], [data])

  const memberName = (id?: string | null) =>
    (membersQuery.data ?? []).find((m) => m.id === id)?.full_name ?? '—'
  const categoryName = (value?: string | null) =>
    labelOf(value)

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

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

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
              <TextField
                select
                label="Categoria"
                fullWidth
                size="small"
                value={filters.type}
                onChange={(e) => setFilter('type', e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {activeCategories.map((cat) => (
                  <MenuItem key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
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
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Recorrência</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell>{e.due_date}</TableCell>
                    <TableCell>{memberName(e.family_member_id)}</TableCell>
                    <TableCell>{categoryName(e.type)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCents(e.amount_cents)}
                    </TableCell>
                    <TableCell>
                      {e.installment_total ? (
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
                            disabled={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(e.id)}
                          >
                            <CheckCircleRoundedIcon fontSize="small" />
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
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              {entries.length} lançamento(s) no período. Total: {data?.total ?? entries.length}.
            </Typography>
          </Box>
        </Card>
      )}

      {formOpen && (
        <EntryFormDialog
          open={formOpen}
          entry={editing}
          onClose={() => setFormOpen(false)}
          onCreatedRecurring={(count) =>
            setToast(`${count} lançamentos previstos criados até dezembro.`)
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

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  )
}
