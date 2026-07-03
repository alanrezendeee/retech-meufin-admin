import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
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
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded'
import FolderSharedRoundedIcon from '@mui/icons-material/FolderSharedRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import {
  createFamilyMember,
  deleteFamilyMember,
  listFamilyMembersPaged,
  updateFamilyMember,
  type FamilyMember,
  type FamilyMemberInput,
} from '../api'
import { errorMessage, GENDER_OPTIONS, healthKeys, RELATIONSHIP_LABEL, RELATIONSHIP_OPTIONS } from '../constants'
import { TablePaginationBR } from '@/components/tables/TablePaginationBR'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { MemberDocumentsDialog } from '../components/MemberDocumentsDialog'

type FormValues = FamilyMemberInput

const emptyForm: FormValues = {
  full_name: '',
  relationship: 'self',
  birth_date: '',
  gender: '',
  document: '',
  notes: '',
  active: true,
}

function MemberFormDialog({
  open,
  member,
  onClose,
}: {
  open: boolean
  member: FamilyMember | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = Boolean(member)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    values: member
      ? {
          full_name: member.full_name,
          relationship: member.relationship,
          birth_date: member.birth_date,
          gender: member.gender ?? '',
          document: member.document ?? '',
          notes: member.notes ?? '',
          active: member.active,
        }
      : emptyForm,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit ? updateFamilyMember(member!.id, values) : createFamilyMember(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: healthKeys.familyMembers() })
      reset(emptyForm)
      onClose()
    },
  })

  const submit = handleSubmit((values) => {
    mutation.mutate({
      ...values,
      gender: values.gender || null,
      document: values.document || null,
      notes: values.notes || null,
    })
  })

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Editar membro' : 'Novo membro da família'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <Controller
            name="full_name"
            control={control}
            rules={{ required: 'Informe o nome completo' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nome completo"
                fullWidth
                required
                error={Boolean(errors.full_name)}
                helperText={errors.full_name?.message}
              />
            )}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="relationship"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField {...field} select label="Parentesco" fullWidth required>
                  {RELATIONSHIP_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="birth_date"
              control={control}
              rules={{ required: 'Informe a data de nascimento' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Data de nascimento"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.birth_date)}
                  helperText={errors.birth_date?.message}
                />
              )}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} select label="Gênero" fullWidth>
                  <MenuItem value="">
                    <em>Não informado</em>
                  </MenuItem>
                  {GENDER_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="document"
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label="Documento (CPF)" fullWidth />
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

export default function FamilyMembersPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyMember | null>(null)
  const [toDelete, setToDelete] = useState<FamilyMember | null>(null)
  const [docsFor, setDocsFor] = useState<FamilyMember | null>(null)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...healthKeys.familyMembers(), page, pageSize],
    queryFn: () => listFamilyMembersPaged({ limit: pageSize, offset: page * pageSize }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFamilyMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: healthKeys.familyMembers() })
      setToDelete(null)
    },
  })

  const members = useMemo(() => data?.items ?? [], [data])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (m: FamilyMember) => {
    setEditing(m)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Membros da Família"
        subtitle="Cadastre as pessoas cujos exames de saúde você vai acompanhar."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Novo membro
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<GroupsRoundedIcon />}
          title="Nenhum membro cadastrado"
          description="Adicione o primeiro membro da família para começar a organizar os exames."
          action={
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Novo membro
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
                  <TableCell>Parentesco</TableCell>
                  <TableCell>Nascimento</TableCell>
                  <TableCell>Documento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{m.full_name}</TableCell>
                    <TableCell>{RELATIONSHIP_LABEL[m.relationship] ?? m.relationship}</TableCell>
                    <TableCell>{m.birth_date}</TableCell>
                    <TableCell>{m.document || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={m.active ? 'Ativo' : 'Inativo'}
                        color={m.active ? 'success' : 'default'}
                        variant={m.active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Documentos">
                        <IconButton size="small" onClick={() => setDocsFor(m)}>
                          <FolderSharedRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(m)}>
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
        <MemberFormDialog open={formOpen} member={editing} onClose={() => setFormOpen(false)} />
      )}

      {docsFor && <MemberDocumentsDialog member={docsFor} onClose={() => setDocsFor(null)} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir membro"
        description={`Tem certeza que deseja excluir "${toDelete?.full_name}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
