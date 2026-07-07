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
  InputAdornment,
  Link,
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
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { createLab, deleteLab, listLabsPaged, updateLab, type Lab, type LabInput } from '../api'
import { errorMessage, healthKeys } from '../constants'
import { TablePaginationBR } from '@/components/tables/TablePaginationBR'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { useToast } from '@/providers/ToastProvider'

type FormValues = LabInput

const emptyForm: FormValues = {
  name: '',
  website_url: '',
  exam_results_url: '',
  contact_phone: '',
  address: '',
  notes: '',
  active: true,
}

function LabFormDialog({
  open,
  lab,
  onClose,
}: {
  open: boolean
  lab: Lab | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const isEdit = Boolean(lab)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    values: lab
      ? {
          name: lab.name,
          website_url: lab.website_url ?? '',
          exam_results_url: lab.exam_results_url ?? '',
          contact_phone: lab.contact_phone ?? '',
          address: lab.address ?? '',
          notes: lab.notes ?? '',
          active: lab.active,
        }
      : emptyForm,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => (isEdit ? updateLab(lab!.id, values) : createLab(values)),
    onSuccess: () => {
      show(isEdit ? 'Laboratório atualizado com sucesso.' : 'Laboratório criado com sucesso.')
      qc.invalidateQueries({ queryKey: healthKeys.labs() })
      reset(emptyForm)
      onClose()
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate({
      ...values,
      website_url: values.website_url || null,
      exam_results_url: values.exam_results_url || null,
      contact_phone: values.contact_phone || null,
      address: values.address || null,
      notes: values.notes || null,
    })
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar laboratório' : 'Novo laboratório'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Informe o nome do laboratório' }}
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="website_url"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="Website" fullWidth />
              )}
            />
            <Controller
              name="exam_results_url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Portal de resultados"
                  fullWidth
                />
              )}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="contact_phone"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="Telefone" fullWidth />
              )}
            />
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="Endereço" fullWidth />
              )}
            />
          </Stack>
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
                control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                label="Ativo"
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

export default function LabsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Lab | null>(null)
  const [toDelete, setToDelete] = useState<Lab | null>(null)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const params = useMemo(
    () => ({
      limit: pageSize,
      offset: page * pageSize,
      query: q.trim() || undefined,
      active: status === '' ? undefined : status === 'true',
    }),
    [pageSize, page, q, status]
  )

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...healthKeys.labs(), params],
    queryFn: () => listLabsPaged(params),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLab(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: healthKeys.labs() })
      setToDelete(null)
      show('Laboratório excluído.')
    },
  })

  const labs = useMemo(() => data?.items ?? [], [data])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (l: Lab) => {
    setEditing(l)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Laboratórios"
        subtitle="Cadastre os laboratórios onde os exames são realizados."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Novo laboratório
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
            placeholder="Buscar por nome…"
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
          <TextField
            select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
            label="Status"
            size="small"
            sx={{ minWidth: { sm: 220 } }}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            <MenuItem value="true">Ativos</MenuItem>
            <MenuItem value="false">Arquivados</MenuItem>
          </TextField>
        </Stack>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : labs.length === 0 ? (
        <EmptyState
          icon={<ScienceRoundedIcon />}
          title="Nenhum laboratório cadastrado"
          description={
            q || status
              ? 'Ajuste a busca ou os filtros.'
              : 'Adicione um laboratório para associar aos resultados de exames.'
          }
          action={
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Novo laboratório
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
                  <TableCell>Telefone</TableCell>
                  <TableCell>Portal</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {labs.map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{l.name}</TableCell>
                    <TableCell>{l.contact_phone || '—'}</TableCell>
                    <TableCell>
                      {l.exam_results_url ? (
                        <Link
                          href={l.exam_results_url}
                          target="_blank"
                          rel="noopener"
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                        >
                          Abrir <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={l.active ? 'Ativo' : 'Inativo'}
                        color={l.active ? 'success' : 'default'}
                        variant={l.active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(l)}>
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setToDelete(l)}>
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

      {formOpen && <LabFormDialog open={formOpen} lab={editing} onClose={() => setFormOpen(false)} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir laboratório"
        description={`Tem certeza que deseja excluir "${toDelete?.name}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
