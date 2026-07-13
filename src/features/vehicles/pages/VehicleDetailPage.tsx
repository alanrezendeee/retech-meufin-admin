import { useState } from 'react'
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
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  createMaintenance,
  deleteMaintenance,
  getDepreciation,
  getFipeHistory,
  getVehicle,
  getVehicleAlerts,
  listMaintenance,
  listVehiclePlans,
  updateMaintenance,
  updateOdometer,
  updateVehiclePlan,
  type Maintenance,
  type MaintenanceInput,
  type VehiclePlan,
} from '../api'
import {
  ALERT_STATUS_COLOR,
  ALERT_STATUS_LABEL,
  errorMessage,
  formatDate,
  formatKM,
  formatMoney,
  FUEL_TYPE_LABEL,
  MAINTENANCE_TYPE_OPTIONS,
  vehicleKeys,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
} from '../constants'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { ErrorState, LoadingState, EmptyState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

// ─── Odometer dialog ──────────────────────────────────────────────────────────

function OdometerDialog({
  open,
  vehicleId,
  current,
  onClose,
}: {
  open: boolean
  vehicleId: string
  current: number
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const { register, handleSubmit, reset } = useForm<{ odometer: string }>({
    defaultValues: { odometer: String(current) },
  })

  const mutation = useMutation({
    mutationFn: (v: { odometer: string }) => updateOdometer(vehicleId, parseInt(v.odometer) || 0),
    onSuccess: () => {
      show('Odômetro atualizado.')
      qc.invalidateQueries({ queryKey: vehicleKeys.detail(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.all })
      reset()
      onClose()
    },
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Atualizar odômetro</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <TextField
            {...register('odometer', { required: true })}
            label="Quilometragem atual"
            type="number"
            fullWidth
            autoFocus
            inputProps={{ min: 0 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">km</InputAdornment>,
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit((v) => mutation.mutate(v))}
          variant="contained"
          disabled={mutation.isPending}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Maintenance tab ──────────────────────────────────────────────────────────

type MaintenanceFormValues = {
  type: string
  title: string
  service_date: string
  odometer_at_service: string
  cost: string
  next_service_odometer: string
  next_service_date: string
  notes: string
}

const emptyMaintenanceForm: MaintenanceFormValues = {
  type: '',
  title: '',
  service_date: '',
  odometer_at_service: '',
  cost: '',
  next_service_odometer: '',
  next_service_date: '',
  notes: '',
}

function MaintenanceFormDialog({
  open,
  vehicleId,
  item,
  onClose,
}: {
  open: boolean
  vehicleId: string
  item: Maintenance | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const isEdit = Boolean(item)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormValues>({
    values: item
      ? {
          type: item.type,
          title: item.title,
          service_date: item.service_date,
          odometer_at_service: item.odometer_at_service != null ? String(item.odometer_at_service) : '',
          cost: item.cost != null ? String(item.cost) : '',
          next_service_odometer:
            item.next_service_odometer != null ? String(item.next_service_odometer) : '',
          next_service_date: item.next_service_date ?? '',
          notes: item.notes ?? '',
        }
      : emptyMaintenanceForm,
  })

  const mutation = useMutation({
    mutationFn: (values: MaintenanceFormValues) => {
      const input: MaintenanceInput = {
        type: values.type.trim(),
        title: values.title.trim(),
        service_date: values.service_date,
        odometer_at_service: values.odometer_at_service
          ? parseInt(values.odometer_at_service)
          : null,
        cost: values.cost ? parseFloat(values.cost) : null,
        next_service_odometer: values.next_service_odometer
          ? parseInt(values.next_service_odometer)
          : null,
        next_service_date: values.next_service_date || null,
        notes: values.notes.trim() || null,
      }
      if (isEdit && item) return updateMaintenance(vehicleId, item.id, input)
      return createMaintenance(vehicleId, input)
    },
    onSuccess: () => {
      show(isEdit ? 'Manutenção atualizada.' : 'Manutenção registrada.')
      qc.invalidateQueries({ queryKey: vehicleKeys.maintenance(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.alerts(vehicleId) })
      reset(emptyMaintenanceForm)
      onClose()
    },
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar manutenção' : 'Registrar manutenção'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

          <Controller
            name="type"
            control={control}
            rules={{ required: 'Informe o tipo' }}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Tipo"
                fullWidth
                required
                error={Boolean(errors.type)}
                helperText={errors.type?.message}
              >
                {MAINTENANCE_TYPE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="title"
            control={control}
            rules={{ required: 'Informe o título' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Título"
                fullWidth
                required
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
              />
            )}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="service_date"
              control={control}
              rules={{ required: 'Informe a data' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Data da manutenção"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.service_date)}
                  helperText={errors.service_date?.message}
                />
              )}
            />
            <Controller
              name="odometer_at_service"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Km no momento"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">km</InputAdornment>,
                  }}
                />
              )}
            />
            <Controller
              name="cost"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Custo (R$)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, step: '0.01' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                />
              )}
            />
          </Stack>

          <Divider />
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            PRÓXIMA MANUTENÇÃO (OPCIONAL)
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="next_service_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Data prevista"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
            <Controller
              name="next_service_odometer"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Km previsto"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">km</InputAdornment>,
                  }}
                />
              )}
            />
          </Stack>

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
        <Button onClick={handleSubmit((v) => mutation.mutate(v))} variant="contained" disabled={mutation.isPending}>
          {isEdit ? 'Salvar' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function MaintenanceTab({ vehicleId }: { vehicleId: string }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Maintenance | null>(null)
  const [toDelete, setToDelete] = useState<Maintenance | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.maintenance(vehicleId),
    queryFn: () => listMaintenance(vehicleId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMaintenance(vehicleId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.maintenance(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.alerts(vehicleId) })
      setToDelete(null)
      show('Manutenção excluída.')
    },
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={() => { setEditing(null); setFormOpen(true) }}
        >
          Registrar manutenção
        </Button>
      </Stack>

      {(!data || data.length === 0) ? (
        <EmptyState
          icon={<SpeedRoundedIcon />}
          title="Nenhuma manutenção registrada"
          description="Registre a primeira manutenção para começar a acompanhar o histórico."
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRoundedIcon />}
              onClick={() => { setEditing(null); setFormOpen(true) }}
            >
              Registrar manutenção
            </Button>
          }
        />
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Tipo / Título</TableCell>
                  <TableCell>Km</TableCell>
                  <TableCell>Custo</TableCell>
                  <TableCell>Próx. km</TableCell>
                  <TableCell>Próx. data</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(m.service_date)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{m.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.type}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {m.odometer_at_service != null ? formatKM(m.odometer_at_service) : '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{formatMoney(m.cost)}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {m.next_service_odometer != null ? formatKM(m.next_service_odometer) : '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {formatDate(m.next_service_date)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => { setEditing(m); setFormOpen(true) }}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setToDelete(m)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {formOpen && (
        <MaintenanceFormDialog
          open={formOpen}
          vehicleId={vehicleId}
          item={editing}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir manutenção"
        description={`Excluir "${toDelete?.title}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

// ─── Plans tab ────────────────────────────────────────────────────────────────

function PlanEditDialog({
  open,
  vehicleId,
  plan,
  onClose,
}: {
  open: boolean
  vehicleId: string
  plan: VehiclePlan
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const { register, handleSubmit } = useForm({
    defaultValues: {
      interval_km: plan.interval_km != null ? String(plan.interval_km) : '',
      interval_days: plan.interval_days != null ? String(plan.interval_days) : '',
    },
  })

  const mutation = useMutation({
    mutationFn: (v: { interval_km: string; interval_days: string }) =>
      updateVehiclePlan(vehicleId, plan.template_id, {
        interval_km: v.interval_km ? parseInt(v.interval_km) : null,
        interval_days: v.interval_days ? parseInt(v.interval_days) : null,
        enabled: plan.enabled,
      }),
    onSuccess: () => {
      show('Plano atualizado.')
      qc.invalidateQueries({ queryKey: vehicleKeys.plans(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.alerts(vehicleId) })
      onClose()
    },
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Personalizar plano: {plan.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <TextField
            {...register('interval_km')}
            label="Intervalo em km"
            type="number"
            fullWidth
            inputProps={{ min: 0 }}
            InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
            helperText="Deixe em branco para usar o padrão"
          />
          <TextField
            {...register('interval_days')}
            label="Intervalo em dias"
            type="number"
            fullWidth
            inputProps={{ min: 0 }}
            InputProps={{ endAdornment: <InputAdornment position="end">dias</InputAdornment> }}
            helperText="Deixe em branco para usar o padrão"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>Cancelar</Button>
        <Button onClick={handleSubmit((v) => mutation.mutate(v))} variant="contained" disabled={mutation.isPending}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function PlansTab({ vehicleId }: { vehicleId: string }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [editingPlan, setEditingPlan] = useState<VehiclePlan | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.plans(vehicleId),
    queryFn: () => listVehiclePlans(vehicleId),
  })

  const toggleMutation = useMutation({
    mutationFn: (plan: VehiclePlan) =>
      updateVehiclePlan(vehicleId, plan.template_id, {
        interval_km: plan.interval_km,
        interval_days: plan.interval_days,
        enabled: !plan.enabled,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.plans(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.alerts(vehicleId) })
      show('Plano atualizado.')
    },
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />

  return (
    <>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plano</TableCell>
                <TableCell>Intervalo km</TableCell>
                <TableCell>Intervalo dias</TableCell>
                <TableCell>Personalizado</TableCell>
                <TableCell>Habilitado</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? []).map((plan) => (
                <TableRow key={plan.template_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{plan.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{plan.type}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {plan.interval_km != null ? formatKM(plan.interval_km) : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {plan.interval_days != null ? `${plan.interval_days} dias` : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={plan.is_customized ? 'Sim' : 'Padrão'}
                      color={plan.is_customized ? 'info' : 'default'}
                      variant={plan.is_customized ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={plan.enabled}
                      size="small"
                      onChange={() => toggleMutation.mutate(plan)}
                      disabled={toggleMutation.isPending}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Personalizar intervalos">
                      <IconButton size="small" onClick={() => setEditingPlan(plan)}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {editingPlan && (
        <PlanEditDialog
          open={Boolean(editingPlan)}
          vehicleId={vehicleId}
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </>
  )
}

// ─── Alerts tab ───────────────────────────────────────────────────────────────

function AlertsTab({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.alerts(vehicleId),
    queryFn: () => getVehicleAlerts(vehicleId),
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />
  if (!data || data.length === 0)
    return <EmptyState icon={<WarningAmberRoundedIcon />} title="Nenhum alerta" description="Habilite planos de manutenção para receber alertas." />

  const overdue = data.filter((a) => a.status === 'overdue')
  const dueSoon = data.filter((a) => a.status === 'due_soon')

  return (
    <Stack spacing={2}>
      {overdue.length > 0 && (
        <Alert severity="error" icon={<WarningAmberRoundedIcon />}>
          {overdue.length} manutenção(ões) vencida(s) — providencie o quanto antes.
        </Alert>
      )}
      {dueSoon.length > 0 && (
        <Alert severity="warning">
          {dueSoon.length} manutenção(ões) próxima(s) do vencimento.
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plano</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Km restante</TableCell>
                <TableCell>Dias restantes</TableCell>
                <TableCell>Último km</TableCell>
                <TableCell>Última data</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.template_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={ALERT_STATUS_LABEL[a.status]}
                      color={ALERT_STATUS_COLOR[a.status]}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {a.km_remaining != null ? formatKM(a.km_remaining) : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {a.days_remaining != null ? `${a.days_remaining} dias` : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {a.last_odometer != null ? formatKM(a.last_odometer) : '—'}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{formatDate(a.last_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  )
}

// ─── Depreciation tab ─────────────────────────────────────────────────────────

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

function DepreciationTab({ vehicleId }: { vehicleId: string }) {
  const theme = useTheme()
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.depreciation(vehicleId),
    queryFn: () => getDepreciation(vehicleId),
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />
  if (!data) return null

  const chartData = data.history.map((h) => ({
    mes: h.reference_month,
    valor: h.fipe_value,
  }))

  const hasFipe = data.current_fipe_value != null

  return (
    <Stack spacing={3}>
      {!hasFipe && (
        <Alert severity="info">
          Nenhum histórico FIPE disponível. O veículo precisa ter os códigos FIPE preenchidos e ao menos um mês de atualização pelo sistema.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard label="Valor de aquisição" value={formatMoney(data.acquisition_price)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard label="Valor FIPE atual" value={formatMoney(data.current_fipe_value)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            label="Depreciação total"
            value={
              data.total_depreciation_pct != null
                ? `${data.total_depreciation_pct.toFixed(1)}% (${formatMoney(data.total_depreciation_r)})`
                : '—'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Meses de posse" value={data.months_owned > 0 ? `${data.months_owned} meses` : '—'} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Depreciação média mensal" value={formatMoney(data.monthly_avg_deprec_r)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard label="Depreciação média anual" value={formatMoney(data.annual_avg_deprec_r)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            label="Tendência (6 meses)"
            value={
              data.trend_6months_r != null
                ? `${formatMoney(data.trend_6months_r)}/mês`
                : '—'
            }
          />
        </Grid>
      </Grid>

      {chartData.length > 1 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Evolução do valor FIPE
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="fipeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    formatter={(v: unknown) => [formatMoney(typeof v === 'number' ? v : null), 'Valor FIPE']}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={theme.palette.primary.main}
                    fill="url(#fipeGrad)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  )
}

// ─── FIPE history tab ─────────────────────────────────────────────────────────

function FipeHistoryTab({ vehicleId }: { vehicleId: string }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.fipeHistory(vehicleId),
    queryFn: () => getFipeHistory(vehicleId),
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />
  if (!data || data.length === 0)
    return (
      <EmptyState
        title="Sem histórico FIPE"
        description="O histórico FIPE é atualizado automaticamente todo mês para veículos com código FIPE cadastrado."
      />
    )

  return (
    <Card>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Mês de referência</TableCell>
              <TableCell>Valor FIPE</TableCell>
              <TableCell>Combustível</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...data].reverse().map((h, i) => (
              <TableRow key={i} hover>
                <TableCell sx={{ fontWeight: 600 }}>{h.reference_month}</TableCell>
                <TableCell>{formatMoney(h.fipe_value)}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{h.fipe_fuel ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [odometerOpen, setOdometerOpen] = useState(false)

  const { data: vehicle, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.detail(vehicleId!),
    queryFn: () => getVehicle(vehicleId!),
    enabled: Boolean(vehicleId),
  })

  if (isLoading) return <LoadingState />
  if (isError || !vehicle)
    return <ErrorState message={errorMessage(error)} onRetry={refetch} />

  return (
    <>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard/frota/veiculos')} size="small" sx={{ mt: 0.5 }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box flex={1}>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Typography variant="h5" fontWeight={800}>
              {vehicle.nickname ?? `${vehicle.make} ${vehicle.model}`}
            </Typography>
            <Chip
              size="small"
              label={VEHICLE_STATUS_LABEL[vehicle.status]}
              color={VEHICLE_STATUS_COLOR[vehicle.status]}
            />
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
            {vehicle.nickname && (
              <Typography variant="body2" color="text.secondary">
                {vehicle.make} {vehicle.model}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {vehicle.year_manufacture}/{vehicle.year_model}
            </Typography>
            {vehicle.plate && (
              <Typography variant="body2" color="text.secondary">
                · {vehicle.plate}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              · {FUEL_TYPE_LABEL[vehicle.fuel_type] ?? vehicle.fuel_type}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Odômetro
            </Typography>
            <Typography variant="subtitle2" fontWeight={700}>
              {formatKM(vehicle.current_odometer)}
            </Typography>
          </Box>
          <Tooltip title="Atualizar km">
            <IconButton size="small" onClick={() => setOdometerOpen(true)}>
              <SpeedRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {vehicle.fipe_code && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Código FIPE: {vehicle.fipe_code}
          {vehicle.acquisition_price && ` · Aquisição: ${formatMoney(vehicle.acquisition_price)}`}
          {vehicle.acquisition_date && ` em ${formatDate(vehicle.acquisition_date)}`}
        </Typography>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Manutenções" />
          <Tab label="Planos" />
          <Tab label="Alertas" />
          <Tab label="Depreciação" />
          <Tab label="Histórico FIPE" />
        </Tabs>
      </Box>

      {tab === 0 && <MaintenanceTab vehicleId={vehicle.id} />}
      {tab === 1 && <PlansTab vehicleId={vehicle.id} />}
      {tab === 2 && <AlertsTab vehicleId={vehicle.id} />}
      {tab === 3 && <DepreciationTab vehicleId={vehicle.id} />}
      {tab === 4 && <FipeHistoryTab vehicleId={vehicle.id} />}

      <OdometerDialog
        open={odometerOpen}
        vehicleId={vehicle.id}
        current={vehicle.current_odometer}
        onClose={() => setOdometerOpen(false)}
      />
    </>
  )
}
