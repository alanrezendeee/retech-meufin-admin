import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
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
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import {
  createIncomeSource,
  deleteIncomeSource,
  listIncomeSourcesPaged,
  updateIncomeSource,
  type IncomeSource,
  type IncomeSourceInput,
} from '../api'
import { errorMessage, financeKeys, SOURCE_KIND_LABEL, SOURCE_KIND_OPTIONS } from '../constants'
import { TablePaginationBR } from '@/components/tables/TablePaginationBR'
import { PageHeader } from '@/features/health/components/PageHeader'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'

type FormValues = IncomeSourceInput

const emptyForm: FormValues = {
  name: '',
  kind: 'clt',
  active: true,
  notes: '',
}

function SourceFormDialog({
  open,
  source,
  onClose,
}: {
  open: boolean
  source: IncomeSource | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = Boolean(source)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    values: source
      ? {
          name: source.name,
          kind: source.kind,
          active: source.active,
          notes: source.notes ?? '',
        }
      : emptyForm,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit ? updateIncomeSource(source!.id, values) : createIncomeSource(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.incomeSources() })
      reset(emptyForm)
      onClose()
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate({
      ...values,
      name: values.name.trim(),
      notes: values.notes?.trim() || null,
    })
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar fonte de receita' : 'Nova fonte de receita'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Informe o nome da fonte' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nome"
                fullWidth
                required
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="kind"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField {...field} select label="Tipo" fullWidth required>
                {SOURCE_KIND_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Observações"
                fullWidth
                multiline
                minRows={2}
              />
            )}
          />
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="Ativa"
              />
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

export default function IncomeSourcesPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<IncomeSource | null>(null)
  const [toDelete, setToDelete] = useState<IncomeSource | null>(null)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...financeKeys.incomeSources(), page, pageSize],
    queryFn: () => listIncomeSourcesPaged({ limit: pageSize, offset: page * pageSize }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIncomeSource(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.incomeSources() })
      setToDelete(null)
    },
  })

  const sources = useMemo(() => data?.items ?? [], [data])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (s: IncomeSource) => {
    setEditing(s)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Fontes de Receita"
        subtitle="Cadastre as origens das suas receitas (empregos, aluguéis, investimentos)."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Nova fonte
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : sources.length === 0 ? (
        <EmptyState
          icon={<AccountBalanceWalletRoundedIcon />}
          title="Nenhuma fonte cadastrada"
          description="Adicione a primeira fonte de receita para vincular aos seus lançamentos."
          action={
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Nova fonte
            </Button>
          }
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Observações</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell>{SOURCE_KIND_LABEL[s.kind] ?? s.kind}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{s.notes || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.active ? 'Ativa' : 'Inativa'}
                        color={s.active ? 'success' : 'default'}
                        variant={s.active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(s)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
        <SourceFormDialog open={formOpen} source={editing} onClose={() => setFormOpen(false)} />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir fonte"
        description={`Tem certeza que deseja excluir "${toDelete?.name}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
