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
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
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
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  cancelEntry,
  confirmEntry,
  createEntry,
  createIncomeSource,
  deleteEntry,
  formatCents,
  listEntries,
  listFamilyMembers,
  listIncomeSources,
  reaisToCents,
  updateEntry,
  type Entry,
  type EntryInput,
  type IncomeSource,
  type ListEntriesParams,
} from '../api'
import {
  ENTRY_STATUS_COLOR,
  ENTRY_STATUS_LABEL,
  ENTRY_STATUS_OPTIONS,
  errorMessage,
  financeKeys,
  INCOME_TYPE_LABEL,
  INCOME_TYPE_OPTIONS,
  MONTH_OPTIONS,
  RECURRENCE_LABEL,
  RECURRENCE_OPTIONS,
  SOURCE_KIND_OPTIONS,
  yearOptions,
} from '../constants'
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
  source_id: string
  type: string
  amount: string // reais
  due_date: string
  recurrence: EntryInput['recurrence']
  description: string
  notes: string
}

function emptyEntryForm(): EntryFormValues {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return {
    family_member_id: '',
    source_id: '',
    type: 'salario',
    amount: '',
    due_date: `${y}-${m}-${d}`,
    recurrence: 'none',
    description: '',
    notes: '',
  }
}

// ---------------------------------------------------------------------------
// Quick-create source mini form
// ---------------------------------------------------------------------------

function QuickSourceForm({
  onCreated,
  onCancel,
}: {
  onCreated: (source: IncomeSource) => void
  onCancel: () => void
}) {
  const qc = useQueryClient()
  const { control, handleSubmit } = useForm<{ name: string; kind: IncomeSource['kind'] }>({
    defaultValues: { name: '', kind: 'clt' },
  })

  const mutation = useMutation({
    mutationFn: (values: { name: string; kind: IncomeSource['kind'] }) =>
      createIncomeSource({ name: values.name.trim(), kind: values.kind, active: true }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: financeKeys.incomeSources() })
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
        Criar fonte rápida
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
          render={({ field }) => <TextField {...field} label="Nome" size="small" fullWidth />}
        />
        <Controller
          name="kind"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Tipo" size="small" sx={{ minWidth: 160 }}>
              {SOURCE_KIND_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" onClick={submit} disabled={mutation.isPending}>
            Salvar
          </Button>
          <Button size="small" color="inherit" onClick={onCancel} disabled={mutation.isPending}>
            Cancelar
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Entry form dialog
// ---------------------------------------------------------------------------

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
  const [quickSource, setQuickSource] = useState(false)

  const membersQuery = useQuery({
    queryKey: financeKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })
  const sourcesQuery = useQuery({
    queryKey: financeKeys.incomeSources(),
    queryFn: listIncomeSources,
  })

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
          source_id: entry.source_id ?? '',
          type: entry.type ?? 'salario',
          amount: (entry.amount_cents / 100).toFixed(2).replace('.', ','),
          due_date: entry.due_date,
          recurrence: entry.recurrence,
          description: entry.description,
          notes: entry.notes ?? '',
        }
      : emptyEntryForm(),
  })

  const recurrence = useWatch({ control, name: 'recurrence' })

  const mutation = useMutation({
    mutationFn: async (values: EntryFormValues) => {
      const base: EntryInput = {
        kind: 'credit',
        status: entry?.status ?? 'prevista',
        amount_cents: reaisToCents(values.amount),
        due_date: values.due_date,
        family_member_id: values.family_member_id || null,
        source_id: values.source_id || null,
        type: (values.type || null) as EntryInput['type'],
        description: values.description.trim(),
        recurrence: values.recurrence,
        notes: values.notes.trim() || null,
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
        {isEdit ? 'Editar receita' : 'Nova receita'}
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

          <Stack spacing={1}>
            <Controller
              name="source_id"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Fonte de receita" fullWidth>
                  <MenuItem value="">
                    <em>Não atribuída</em>
                  </MenuItem>
                  {(sourcesQuery.data ?? []).map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            {quickSource ? (
              <QuickSourceForm
                onCreated={(created) => {
                  setValue('source_id', created.id)
                  setQuickSource(false)
                }}
                onCancel={() => setQuickSource(false)}
              />
            ) : (
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setQuickSource(true)}>
                Criar fonte rápida
              </Button>
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Tipo" fullWidth>
                  {INCOME_TYPE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="amount"
              control={control}
              rules={{
                required: 'Informe o valor',
                validate: (v) => reaisToCents(v) > 0 || 'Valor deve ser maior que zero',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Valor"
                  fullWidth
                  required
                  placeholder="0,00"
                  error={Boolean(errors.amount)}
                  helperText={errors.amount?.message}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
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
                <TextField {...field} select label="Recorrência" fullWidth disabled={isEdit}>
                  {RECURRENCE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>

          {!isEdit && recurrence !== 'none' && (
            <Alert severity="info" icon={<RepeatRoundedIcon />}>
              Ao salvar, o sistema gera os lançamentos <strong>previstos</strong> até dezembro do
              ano. Confirme cada um conforme for recebido.
            </Alert>
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

export default function ReceitasPage() {
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
  const sourcesQuery = useQuery({
    queryKey: financeKeys.incomeSources(),
    queryFn: listIncomeSources,
  })

  const listParams: ListEntriesParams = useMemo(() => {
    const p: ListEntriesParams = {
      kind: 'credit',
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
      setToast('Receita confirmada como recebida.')
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
  const sourceName = (id?: string | null) =>
    (sourcesQuery.data ?? []).find((s) => s.id === id)?.name ?? '—'

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
        title="Receitas"
        subtitle="Lance as receitas da família. Recorrentes viram previstos do ano; confirmar marca como recebido."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Nova receita
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
            color="success.main"
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
                label="Tipo"
                fullWidth
                size="small"
                value={filters.type}
                onChange={(e) => setFilter('type', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {INCOME_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
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
          icon={<PaymentsRoundedIcon />}
          title="Nenhuma receita no período"
          description="Ajuste os filtros ou lance uma nova receita para começar."
          action={
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Nova receita
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
                  <TableCell>Fonte</TableCell>
                  <TableCell>Tipo</TableCell>
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
                    <TableCell>{sourceName(e.source_id)}</TableCell>
                    <TableCell>{e.type ? INCOME_TYPE_LABEL[e.type] ?? e.type : '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {formatCents(e.amount_cents)}
                    </TableCell>
                    <TableCell>
                      {e.recurrence !== 'none' ? (
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
                        <Tooltip title="Confirmar recebimento">
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
        title="Excluir receita"
        description={`Excluir "${toDelete?.description}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={Boolean(toCancel)}
        title="Cancelar receita"
        description={`Marcar "${toCancel?.description}" como cancelada?`}
        confirmLabel="Cancelar receita"
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
