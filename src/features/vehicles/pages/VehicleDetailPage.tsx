import { useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
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
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
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
  createSchedule,
  createServiceOrder,
  deleteMaintenance,
  deleteSchedule,
  deleteServiceOrder,
  getDepreciation,
  getFipeHistory,
  getVehicle,
  getVehicleAlerts,
  getVehicleAnalytics,
  listMaintenance,
  listSchedules,
  listServiceOrders,
  listVehiclePlans,
  searchCatalog,
  updateMaintenance,
  updateOdometer,
  updateSchedule,
  updateServiceOrder,
  updateVehiclePlan,
  type MaintenanceCatalogItem,
  type Maintenance,
  type MaintenanceInput,
  type MaintenanceSchedule,
  type OSItemCategory,
  type ScheduleAlertStatus,
  type ServiceOrder,
  type ServiceOrderItemInput,
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
  OS_ITEM_CATEGORY_LABEL,
  OS_ITEM_CATEGORY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  SCHEDULE_ALERT_STATUS_COLOR,
  SCHEDULE_ALERT_STATUS_LABEL,
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

// ─── Service Orders tab ───────────────────────────────────────────────────────

type OSItemFormRow = {
  catalog_item_id?: string
  item_type: 'product' | 'service'
  category: string
  description: string
  quantity: string
  unit_price_cents: string  // stored as integer cents string
  replacement_interval_km: string
  replacement_interval_months: string
  warranty_expires_km: string
  notes: string
}

const emptyItemRow: OSItemFormRow = {
  catalog_item_id: undefined,
  item_type: 'product',
  category: 'motor',
  description: '',
  quantity: '1',
  unit_price_cents: '0',
  replacement_interval_km: '',
  replacement_interval_months: '',
  warranty_expires_km: '',
  notes: '',
}

function CatalogAutocomplete({
  defaultValue,
  onSelect,
  onType,
}: {
  defaultValue: string
  onSelect: (item: MaintenanceCatalogItem) => void
  onType: (text: string) => void
}) {
  const [inputVal, setInputVal] = useState(defaultValue)
  const [open, setOpen] = useState(false)

  const { data: opts = [] } = useQuery({
    queryKey: vehicleKeys.catalog(inputVal, ''),
    queryFn: () => searchCatalog(inputVal, '', 30),
    enabled: open && inputVal.length >= 1,
    staleTime: 60_000,
    placeholderData: (prev: MaintenanceCatalogItem[] | undefined) => prev ?? [],
  })

  return (
    <Autocomplete
      freeSolo
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={opts}
      getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
      groupBy={(o) =>
        typeof o === 'string' ? '' : (OS_ITEM_CATEGORY_LABEL[o.category as OSItemCategory] ?? o.category)
      }
      filterOptions={(x) => x}
      noOptionsText={inputVal.length < 1 ? 'Digite para buscar' : 'Nenhum item encontrado'}
      inputValue={inputVal}
      onInputChange={(_, v, reason) => {
        setInputVal(v)
        if (reason === 'input') onType(v)
      }}
      onChange={(_, v) => {
        if (v && typeof v !== 'string') {
          setInputVal(v.name)
          onSelect(v)
        } else if (v === null) {
          setInputVal('')
          onType('')
        }
      }}
      renderOption={(props, o) => {
        const item = o as MaintenanceCatalogItem
        return (
          <Box component="li" {...props} key={item.id}>
            <Stack>
              <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
              {item.description && (
                <Typography variant="caption" color="text.secondary">{item.description}</Typography>
              )}
            </Stack>
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label="Item / Serviço *"
          required
          placeholder="Buscar no catálogo..."
          helperText="Selecione do catálogo ou descreva livremente"
        />
      )}
    />
  )
}

type OSFormValues = {
  service_date: string
  km_at_service: string
  os_number: string
  supplier_id: string
  payment_method: string
  technician: string
  notes: string
}

function ServiceOrderDialog({
  open,
  vehicleId,
  currentKM,
  order,
  onClose,
}: {
  open: boolean
  vehicleId: string
  currentKM: number
  order: ServiceOrder | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const isEdit = Boolean(order)
  const [items, setItems] = useState<OSItemFormRow[]>(() =>
    order
      ? order.items.map((it) => ({
          catalog_item_id: it.catalog_item_id ?? undefined,
          item_type: it.item_type,
          category: it.category,
          description: it.description,
          quantity: String(it.quantity),
          unit_price_cents: String(it.unit_price_cents),
          replacement_interval_km: it.replacement_interval_km != null ? String(it.replacement_interval_km) : '',
          replacement_interval_months:
            it.replacement_interval_months != null ? String(it.replacement_interval_months) : '',
          warranty_expires_km: it.warranty_expires_km != null ? String(it.warranty_expires_km) : '',
          notes: it.notes ?? '',
        }))
      : [{ ...emptyItemRow }],
  )

  const today = new Date().toISOString().slice(0, 10)
  const { register, handleSubmit, formState: { errors } } = useForm<OSFormValues>({
    defaultValues: order
      ? {
          service_date: order.service_date,
          km_at_service: String(order.km_at_service),
          os_number: order.os_number ?? '',
          supplier_id: order.supplier_id ?? '',
          payment_method: order.payment_method ?? '',
          technician: order.technician ?? '',
          notes: order.notes ?? '',
        }
      : { service_date: today, km_at_service: String(currentKM), os_number: '', supplier_id: '', payment_method: '', technician: '', notes: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: OSFormValues) => {
      const parsedItems: ServiceOrderItemInput[] = items.map((r) => ({
        catalog_item_id: r.catalog_item_id ?? null,
        item_type: r.item_type,
        category: r.category as never,
        description: r.description,
        quantity: parseFloat(r.quantity) || 1,
        unit_price_cents: parseInt(r.unit_price_cents) || 0,
        replacement_interval_km: r.replacement_interval_km ? parseInt(r.replacement_interval_km) : null,
        replacement_interval_months: r.replacement_interval_months ? parseInt(r.replacement_interval_months) : null,
        warranty_expires_km: r.warranty_expires_km ? parseInt(r.warranty_expires_km) : null,
        notes: r.notes || null,
      }))
      const base = {
        service_date: values.service_date,
        km_at_service: parseInt(values.km_at_service) || 0,
        os_number: values.os_number || null,
        supplier_id: values.supplier_id || null,
        payment_method: values.payment_method || null,
        technician: values.technician || null,
        notes: values.notes || null,
        status: 'completed' as const,
      }
      if (isEdit && order) {
        return updateServiceOrder(vehicleId, order.id, base)
      }
      return createServiceOrder(vehicleId, { ...base, items: parsedItems })
    },
    onSuccess: () => {
      show(isEdit ? 'OS atualizada.' : 'OS registrada.')
      qc.invalidateQueries({ queryKey: vehicleKeys.serviceOrders(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.schedules(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.analytics(vehicleId, 12) })
      onClose()
    },
  })

  const total = items.reduce((sum, r) => {
    const qty = parseFloat(r.quantity) || 0
    const price = parseInt(r.unit_price_cents) || 0
    return sum + qty * price
  }, 0)

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                {...register('service_date', { required: 'Obrigatório' })}
                label="Data do serviço"
                type="date"
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.service_date)}
                helperText={errors.service_date?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                {...register('km_at_service')}
                label="Km no serviço"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField {...register('os_number')} label="Nº da OS" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField {...register('technician')} label="Técnico / Mecânico" fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField {...register('payment_method')} label="Forma de pagamento" select fullWidth>
                <MenuItem value="">—</MenuItem>
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField {...register('notes')} label="Observações" fullWidth multiline minRows={1} />
            </Grid>
          </Grid>

          <Divider />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>Itens</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setItems((p) => [...p, { ...emptyItemRow }])}>
              Adicionar item
            </Button>
          </Stack>

          {items.map((row, idx) => (
            <Card key={idx} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1.5}>
                {/* Row 1: Catalog search (full width) */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <CatalogAutocomplete
                      defaultValue={row.description}
                      onSelect={(item) =>
                        setItems((p) =>
                          p.map((r, i) =>
                            i === idx
                              ? {
                                  ...r,
                                  catalog_item_id: item.id,
                                  item_type: item.item_type as 'product' | 'service',
                                  category: item.category,
                                  description: item.name,
                                  replacement_interval_km:
                                    item.default_interval_km != null
                                      ? String(item.default_interval_km)
                                      : r.replacement_interval_km,
                                  replacement_interval_months:
                                    item.default_interval_months != null
                                      ? String(item.default_interval_months)
                                      : r.replacement_interval_months,
                                }
                              : r,
                          ),
                        )
                      }
                      onType={(text) =>
                        setItems((p) =>
                          p.map((r, i) =>
                            i === idx ? { ...r, description: text, catalog_item_id: undefined } : r,
                          ),
                        )
                      }
                    />
                  </Box>
                  <Tooltip title="Remover item">
                    <IconButton
                      size="small"
                      color="error"
                      sx={{ mt: 0.5 }}
                      onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Row 2: Type + Category + Qty + Price */}
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select fullWidth size="small" label="Tipo"
                      value={row.item_type}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((r, i) =>
                            i === idx ? { ...r, item_type: e.target.value as 'product' | 'service' } : r,
                          ),
                        )
                      }
                    >
                      <MenuItem value="product">Peça / Produto</MenuItem>
                      <MenuItem value="service">Serviço</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select fullWidth size="small" label="Categoria"
                      value={row.category}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((r, i) => i === idx ? { ...r, category: e.target.value } : r)
                        )
                      }
                    >
                      {OS_ITEM_CATEGORY_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      fullWidth size="small" label="Qtd" type="number"
                      inputProps={{ min: 0, step: '0.001' }}
                      value={row.quantity}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r)
                        )
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 8, sm: 4 }}>
                    <TextField
                      fullWidth size="small" label="Preço unit. (centavos)" type="number"
                      inputProps={{ min: 0 }}
                      value={row.unit_price_cents}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((r, i) => i === idx ? { ...r, unit_price_cents: e.target.value } : r)
                        )
                      }
                      helperText={
                        row.unit_price_cents
                          ? `= ${formatMoney((parseInt(row.unit_price_cents) || 0) / 100)}`
                          : ''
                      }
                    />
                  </Grid>
                </Grid>

                {/* Row 3: Replacement intervals (products only) */}
                {row.item_type === 'product' && (
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <TextField
                        fullWidth size="small" label="Troca a cada" type="number"
                        inputProps={{ min: 0 }}
                        value={row.replacement_interval_km}
                        onChange={(e) =>
                          setItems((p) =>
                            p.map((r, i) =>
                              i === idx ? { ...r, replacement_interval_km: e.target.value } : r
                            )
                          )
                        }
                        InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <TextField
                        fullWidth size="small" label="Troca a cada" type="number"
                        inputProps={{ min: 0 }}
                        value={row.replacement_interval_months}
                        onChange={(e) =>
                          setItems((p) =>
                            p.map((r, i) =>
                              i === idx ? { ...r, replacement_interval_months: e.target.value } : r
                            )
                          )
                        }
                        InputProps={{ endAdornment: <InputAdornment position="end">meses</InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <TextField
                        fullWidth size="small" label="Garantia" type="number"
                        inputProps={{ min: 0 }}
                        value={row.warranty_expires_km}
                        onChange={(e) =>
                          setItems((p) =>
                            p.map((r, i) =>
                              i === idx ? { ...r, warranty_expires_km: e.target.value } : r
                            )
                          )
                        }
                        InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
                      />
                    </Grid>
                  </Grid>
                )}
              </Stack>
            </Card>
          ))}

          <Stack direction="row" justifyContent="flex-end">
            <Typography variant="subtitle2" fontWeight={700}>
              Total: {formatMoney(total / 100)}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>Cancelar</Button>
        <Button onClick={handleSubmit((v) => mutation.mutate(v))} variant="contained" disabled={mutation.isPending}>
          {isEdit ? 'Salvar' : 'Registrar OS'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ServiceOrdersTab({ vehicleId, currentKM }: { vehicleId: string; currentKM: number }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceOrder | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<ServiceOrder | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.serviceOrders(vehicleId),
    queryFn: () => listServiceOrders(vehicleId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceOrder(vehicleId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.serviceOrders(vehicleId) })
      qc.invalidateQueries({ queryKey: vehicleKeys.analytics(vehicleId, 12) })
      setToDelete(null)
      show('OS excluída.')
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
          Nova OS
        </Button>
      </Stack>

      {(!data || data.length === 0) ? (
        <EmptyState
          icon={<SpeedRoundedIcon />}
          title="Nenhuma Ordem de Serviço"
          description="Registre a primeira OS para rastrear custos e manutenções."
          action={
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />}
              onClick={() => { setEditing(null); setFormOpen(true) }}>
              Nova OS
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {data.map((order) => (
            <Card key={order.id}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Box flex={1}>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {formatDate(order.service_date)}
                      </Typography>
                      {order.os_number && (
                        <Typography variant="caption" color="text.secondary">OS #{order.os_number}</Typography>
                      )}
                      <Chip
                        size="small"
                        label={order.status === 'completed' ? 'Concluída' : order.status === 'draft' ? 'Rascunho' : 'Cancelada'}
                        color={order.status === 'completed' ? 'success' : order.status === 'draft' ? 'default' : 'error'}
                        variant="outlined"
                      />
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                      <Typography variant="body2" color="text.secondary">
                        <strong>{formatKM(order.km_at_service)}</strong>
                      </Typography>
                      <Typography variant="body2" color="primary.main" fontWeight={700}>
                        {formatMoney(order.total_cents / 100)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.items.length} item(ns)
                      </Typography>
                      {order.technician && (
                        <Typography variant="body2" color="text.secondary">· {order.technician}</Typography>
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => { setEditing(order); setFormOpen(true) }}>
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => setToDelete(order)}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={expanded === order.id ? 'Fechar itens' : 'Ver itens'}>
                      <IconButton size="small" onClick={() => setExpanded((p) => p === order.id ? null : order.id)}>
                        {expanded === order.id ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Collapse in={expanded === order.id} unmountOnExit>
                  <Divider sx={{ my: 1.5 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tipo</TableCell>
                          <TableCell>Descrição</TableCell>
                          <TableCell>Qtd</TableCell>
                          <TableCell>Unit.</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Próx. troca</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.id} hover>
                            <TableCell>
                              <Chip size="small" label={OS_ITEM_CATEGORY_LABEL[item.category] ?? item.category} variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{item.description}</Typography>
                              {item.item_type === 'product' && item.km_at_installation != null && (
                                <Typography variant="caption" color="text.secondary">
                                  Instalado: {formatKM(item.km_at_installation)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{item.quantity}</TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>{formatMoney(item.unit_price_cents / 100)}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{formatMoney(item.total_price_cents / 100)}</TableCell>
                            <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {item.next_due_km != null && <div>{formatKM(item.next_due_km)}</div>}
                              {item.next_due_date && <div>{formatDate(item.next_due_date)}</div>}
                              {item.next_due_km == null && !item.next_due_date && '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {formOpen && (
        <ServiceOrderDialog
          open={formOpen}
          vehicleId={vehicleId}
          currentKM={currentKM}
          order={editing}
          onClose={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir OS"
        description={`Excluir a OS de ${toDelete ? formatDate(toDelete.service_date) : ''}? Todos os itens serão removidos.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

// ─── Schedules tab ────────────────────────────────────────────────────────────

function SchedulesTab({ vehicleId }: { vehicleId: string }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<MaintenanceSchedule | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.schedules(vehicleId),
    queryFn: () => listSchedules(vehicleId),
  })

  const completeMutation = useMutation({
    mutationFn: (sched: MaintenanceSchedule) =>
      updateSchedule(vehicleId, sched.id, {
        description: sched.description,
        category: sched.category,
        scheduled_km: sched.scheduled_km,
        scheduled_date: sched.scheduled_date,
        alert_status: 'done' as ScheduleAlertStatus,
        completed_at: new Date().toISOString().slice(0, 10),
        notes: sched.notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.schedules(vehicleId) })
      show('Agendamento marcado como concluído.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSchedule(vehicleId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.schedules(vehicleId) })
      setToDelete(null)
      show('Agendamento excluído.')
    },
  })

  const [newSched, setNewSched] = useState({ description: '', category: 'outros', scheduled_km: '', scheduled_date: '', notes: '' })
  const createMutation = useMutation({
    mutationFn: () => createSchedule(vehicleId, {
      description: newSched.description,
      category: newSched.category as never,
      scheduled_km: newSched.scheduled_km ? parseInt(newSched.scheduled_km) : null,
      scheduled_date: newSched.scheduled_date || null,
      notes: newSched.notes || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vehicleKeys.schedules(vehicleId) })
      show('Agendamento criado.')
      setNewSched({ description: '', category: 'outros', scheduled_km: '', scheduled_date: '', notes: '' })
      setFormOpen(false)
    },
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => setFormOpen(true)}>
          Novo agendamento
        </Button>
      </Stack>

      {(!data || data.length === 0) ? (
        <EmptyState
          icon={<WarningAmberRoundedIcon />}
          title="Nenhum agendamento"
          description="Os agendamentos são criados automaticamente ao registrar peças com intervalo de troca, ou manualmente."
          action={
            <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => setFormOpen(true)}>
              Novo agendamento
            </Button>
          }
        />
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Km previsto</TableCell>
                  <TableCell>Data prevista</TableCell>
                  <TableCell>Concluído em</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.id} hover sx={{ opacity: s.alert_status === 'cancelled' || s.alert_status === 'done' ? 0.6 : 1 }}>
                    <TableCell>
                      <Chip
                        size="small"
                        label={SCHEDULE_ALERT_STATUS_LABEL[s.alert_status]}
                        color={SCHEDULE_ALERT_STATUS_COLOR[s.alert_status]}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{s.description}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {OS_ITEM_CATEGORY_LABEL[s.category] ?? s.category}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {s.scheduled_km != null ? formatKM(s.scheduled_km) : '—'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {formatDate(s.scheduled_date)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {formatDate(s.completed_at)}
                    </TableCell>
                    <TableCell align="right">
                      {s.alert_status !== 'done' && s.alert_status !== 'cancelled' && (
                        <Tooltip title="Marcar como concluído">
                          <IconButton size="small" color="success" onClick={() => completeMutation.mutate(s)} disabled={completeMutation.isPending}>
                            <CheckCircleOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setToDelete(s)}>
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

      {/* Quick create dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Novo agendamento</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {createMutation.isError && <ErrorState message={errorMessage(createMutation.error)} />}
            <TextField
              label="Descrição" fullWidth required
              value={newSched.description}
              onChange={(e) => setNewSched((p) => ({ ...p, description: e.target.value }))}
            />
            <TextField
              label="Categoria" select fullWidth
              value={newSched.category}
              onChange={(e) => setNewSched((p) => ({ ...p, category: e.target.value }))}
            >
              {OS_ITEM_CATEGORY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Km previsto" type="number" fullWidth
                value={newSched.scheduled_km}
                onChange={(e) => setNewSched((p) => ({ ...p, scheduled_km: e.target.value }))}
                InputProps={{ endAdornment: <InputAdornment position="end">km</InputAdornment> }}
              />
              <TextField
                label="Data prevista" type="date" fullWidth
                InputLabelProps={{ shrink: true }}
                value={newSched.scheduled_date}
                onChange={(e) => setNewSched((p) => ({ ...p, scheduled_date: e.target.value }))}
              />
            </Stack>
            <TextField
              label="Observações" fullWidth multiline minRows={2}
              value={newSched.notes}
              onChange={(e) => setNewSched((p) => ({ ...p, notes: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={() => createMutation.mutate()} variant="contained" disabled={!newSched.description || createMutation.isPending}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir agendamento"
        description={`Excluir "${toDelete?.description}"?`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

function AnalyticsTab({ vehicleId }: { vehicleId: string }) {
  const theme = useTheme()
  const [months, setMonths] = useState(12)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: vehicleKeys.analytics(vehicleId, months),
    queryFn: () => getVehicleAnalytics(vehicleId, months),
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />
  if (!data) return null

  const monthlyMax = Math.max(...(data.monthly_spending.map((m) => m.total_cents)), 1)

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="flex-end">
        <TextField
          select size="small" label="Período" value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          sx={{ width: 160 }}
        >
          <MenuItem value={3}>3 meses</MenuItem>
          <MenuItem value={6}>6 meses</MenuItem>
          <MenuItem value={12}>12 meses</MenuItem>
          <MenuItem value={24}>24 meses</MenuItem>
        </TextField>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <MetricCard label="Total gasto" value={formatMoney(data.total_spent_cents / 100)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <MetricCard label="Em peças" value={formatMoney(data.total_products_cents / 100)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <MetricCard label="Em serviços" value={formatMoney(data.total_services_cents / 100)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <MetricCard
            label="Custo por km"
            value={data.cost_per_km != null ? `R$ ${data.cost_per_km.toFixed(2)}/km` : '—'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <MetricCard label="Total de OS" value={String(data.total_os_count)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <MetricCard label="Ticket médio OS" value={formatMoney(data.avg_cost_per_os_cents / 100)} />
        </Grid>
      </Grid>

      {data.monthly_spending.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Gasto mensal</Typography>
            <Stack spacing={1}>
              {data.monthly_spending.map((m) => (
                <Box key={m.month}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">{m.month}</Typography>
                    <Typography variant="caption" fontWeight={700}>{formatMoney(m.total_cents / 100)}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(m.total_cents / monthlyMax) * 100}
                    sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 4 } }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        {data.spending_by_category.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Por categoria</Typography>
                <Stack spacing={1}>
                  {data.spending_by_category.slice(0, 8).map((c) => (
                    <Stack key={c.category} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{OS_ITEM_CATEGORY_LABEL[c.category as never] ?? c.category}</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatMoney(c.total_cents / 100)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {data.spending_by_supplier.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Por fornecedor</Typography>
                <Stack spacing={1}>
                  {data.spending_by_supplier.slice(0, 8).map((s) => (
                    <Stack key={s.supplier_id || s.supplier_name} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{s.supplier_name}</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatMoney(s.total_cents / 100)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Stack>
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
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Ordens de Serviço" />
          <Tab label="Agendamentos" />
          <Tab label="Analytics" />
          <Tab label="Alertas" />
          <Tab label="Depreciação" />
          <Tab label="Histórico FIPE" />
          <Tab label="Manutenções" />
          <Tab label="Planos" />
        </Tabs>
      </Box>

      {tab === 0 && <ServiceOrdersTab vehicleId={vehicle.id} currentKM={vehicle.current_odometer} />}
      {tab === 1 && <SchedulesTab vehicleId={vehicle.id} />}
      {tab === 2 && <AnalyticsTab vehicleId={vehicle.id} />}
      {tab === 3 && <AlertsTab vehicleId={vehicle.id} />}
      {tab === 4 && <DepreciationTab vehicleId={vehicle.id} />}
      {tab === 5 && <FipeHistoryTab vehicleId={vehicle.id} />}
      {tab === 6 && <MaintenanceTab vehicleId={vehicle.id} />}
      {tab === 7 && <PlansTab vehicleId={vehicle.id} />}

      <OdometerDialog
        open={odometerOpen}
        vehicleId={vehicle.id}
        current={vehicle.current_odometer}
        onClose={() => setOdometerOpen(false)}
      />
    </>
  )
}
