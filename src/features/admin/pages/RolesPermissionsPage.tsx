import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import {
  createRole,
  deleteRole,
  getRole,
  listPermissions,
  listRoles,
  setRolePermissions,
  updateRole,
  type Permission,
  type Role,
} from '../api'
import { adminKeys, errorMessage, isProtectedRole, moduleLabel, moduleOf } from '../constants'
import { PageHeader } from '@/features/health/components/PageHeader'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

// ---------------------------------------------------------------------------
// Dialog: criar/editar grupo
// ---------------------------------------------------------------------------

type RoleFormValues = {
  name: string
  code: string
  description: string
  active: boolean
}

function RoleFormDialog({ role, onClose }: { role: Role | null; onClose: () => void }) {
  const qc = useQueryClient()
  const { show } = useToast()
  const isEdit = Boolean(role)
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    values: role
      ? {
          name: role.name,
          code: role.code,
          description: role.description ?? '',
          active: role.active ?? true,
        }
      : { name: '', code: '', description: '', active: true },
  })

  const mutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      isEdit
        ? updateRole(role!.id, {
            name: values.name.trim(),
            description: values.description.trim() || null,
            active: values.active,
          })
        : createRole({
            name: values.name.trim(),
            code: values.code.trim(),
            description: values.description.trim() || null,
            system: false,
          }),
    onSuccess: () => {
      show(isEdit ? 'Grupo atualizado com sucesso.' : 'Grupo criado com sucesso.')
      qc.invalidateQueries({ queryKey: adminKeys.all })
      onClose()
    },
  })

  const submit = handleSubmit((values) => mutation.mutate(values))

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>{isEdit ? 'Editar grupo' : 'Novo grupo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Informe o nome' }}
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
            name="code"
            control={control}
            rules={{ required: 'Informe o código' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Código"
                fullWidth
                required
                disabled={isEdit}
                helperText={
                  isEdit ? 'O código não pode ser alterado.' : errors.code?.message
                }
                error={Boolean(errors.code)}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Descrição" fullWidth multiline minRows={2} />
            )}
          />
          {isEdit && (
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Ativo"
                />
              )}
            />
          )}
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
// Painel de permissões (direita)
// ---------------------------------------------------------------------------

function PermissionsPanel({
  roleId,
  permissions,
}: {
  roleId: string
  permissions: Permission[]
}) {
  const qc = useQueryClient()
  const roleQuery = useQuery({
    queryKey: adminKeys.role(roleId),
    queryFn: () => getRole(roleId),
  })

  // Sincroniza o set de permissões marcadas com os dados do grupo durante o render
  // (padrão "adjust state while rendering" — evita setState em useEffect).
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [syncedData, setSyncedData] = useState<Role | undefined>(undefined)
  if (roleQuery.data && roleQuery.data !== syncedData) {
    setSyncedData(roleQuery.data)
    setChecked(new Set((roleQuery.data.permissions ?? []).map((p) => p.code)))
  }

  const readOnly = roleQuery.data ? isProtectedRole(roleQuery.data) : false

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of permissions) {
      const mod = moduleOf(p.subject)
      if (!map.has(mod)) map.set(mod, [])
      map.get(mod)!.push(p)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [permissions])

  const { show } = useToast()

  const mutation = useMutation({
    mutationFn: () => setRolePermissions(roleId, { permission_codes: [...checked] }),
    onSuccess: () => {
      show('Permissões salvas com sucesso.')
      qc.invalidateQueries({ queryKey: adminKeys.role(roleId) })
      qc.invalidateQueries({ queryKey: adminKeys.all })
    },
  })

  const toggle = (code: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const toggleModule = (mods: Permission[], allChecked: boolean) => {
    setChecked((prev) => {
      const next = new Set(prev)
      for (const p of mods) {
        if (allChecked) next.delete(p.code)
        else next.add(p.code)
      }
      return next
    })
  }

  if (roleQuery.isLoading) return <LoadingState />
  if (roleQuery.isError)
    return <ErrorState message={errorMessage(roleQuery.error)} onRetry={roleQuery.refetch} />

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>
            {roleQuery.data?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {roleQuery.data?.code}
          </Typography>
        </Box>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Salvar permissões
          </Button>
        )}
      </Stack>

      {readOnly && (
        <Alert severity="info" icon={<LockRoundedIcon />}>
          Grupo <strong>fixo</strong> do sistema — não pode ser editado nem excluído, e as permissões não
          podem ser alteradas. Crie um grupo <strong>personalizado</strong> para ajustar permissões.
        </Alert>
      )}
      {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
      {mutation.isSuccess && !mutation.isPending && (
        <Alert severity="success">Permissões salvas com sucesso.</Alert>
      )}

      {grouped.map(([mod, perms]) => {
        const allChecked = perms.every((p) => checked.has(p.code))
        const someChecked = perms.some((p) => checked.has(p.code))
        return (
          <Accordion key={mod} defaultExpanded disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
              <FormControlLabel
                onClick={(e) => e.stopPropagation()}
                control={
                  <Checkbox
                    checked={allChecked}
                    indeterminate={!allChecked && someChecked}
                    disabled={readOnly}
                    onChange={() => toggleModule(perms, allChecked)}
                  />
                }
                label={
                  <Typography fontWeight={700}>
                    {moduleLabel(mod)}{' '}
                    <Typography component="span" variant="body2" color="text.secondary">
                      ({perms.filter((p) => checked.has(p.code)).length}/{perms.length})
                    </Typography>
                  </Typography>
                }
              />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={1}>
                {perms.map((p) => (
                  <Grid key={p.id} size={{ xs: 12, sm: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={checked.has(p.code)}
                          disabled={readOnly}
                          onChange={() => toggle(p.code)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {p.subject}.{p.action}
                          </Typography>
                          {p.description && (
                            <Typography variant="caption" color="text.secondary">
                              {p.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Stack>
  )
}

// ---------------------------------------------------------------------------
// Página master-detail
// ---------------------------------------------------------------------------

export default function RolesPermissionsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formRole, setFormRole] = useState<Role | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Role | null>(null)

  const rolesQuery = useQuery({
    queryKey: adminKeys.roles({ include_permissions: true }),
    queryFn: () => listRoles({ include_permissions: true }),
  })
  const roles = useMemo(() => rolesQuery.data?.roles ?? [], [rolesQuery.data])

  const permissionsQuery = useQuery({
    queryKey: adminKeys.permissions(),
    queryFn: listPermissions,
  })
  const permissions = useMemo(
    () => permissionsQuery.data?.permissions ?? [],
    [permissionsQuery.data]
  )

  // Grupo efetivamente selecionado: o escolhido pelo usuário (se ainda existir na
  // lista) ou, por padrão, o primeiro grupo. Derivado no render — sem useEffect.
  const effectiveSelectedId =
    (selectedId && roles.some((r) => r.id === selectedId) ? selectedId : null) ??
    roles[0]?.id ??
    null

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: adminKeys.all })
      setToDelete(null)
      // Se o grupo removido era o selecionado, limpa a seleção manual;
      // o render volta a escolher o primeiro grupo disponível.
      if (selectedId === id) setSelectedId(null)
      show('Grupo excluído.')
    },
  })

  const openCreate = () => {
    setFormRole(null)
    setFormOpen(true)
  }
  const openEdit = (r: Role) => {
    setFormRole(r)
    setFormOpen(true)
  }

  const catalogGrouped = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of permissions) {
      const mod = moduleOf(p.subject)
      if (!map.has(mod)) map.set(mod, [])
      map.get(mod)!.push(p)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [permissions])

  return (
    <>
      <PageHeader
        title="Permissões & Grupos"
        subtitle="Gerencie os grupos de acesso e as permissões atribuídas a cada um."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Novo grupo
          </Button>
        }
      />

      {rolesQuery.isLoading ? (
        <LoadingState />
      ) : rolesQuery.isError ? (
        <ErrorState message={errorMessage(rolesQuery.error)} onRetry={rolesQuery.refetch} />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={<AdminPanelSettingsRoundedIcon />}
          title="Nenhum grupo cadastrado"
          description="Crie o primeiro grupo de acesso para começar a atribuir permissões."
          action={
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
              Novo grupo
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {/* Esquerda: lista de grupos */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <List disablePadding>
                {roles.map((r) => {
                  const protectedRole = isProtectedRole(r)
                  return (
                    <Box key={r.id}>
                      <ListItemButton
                        selected={effectiveSelectedId === r.id}
                        onClick={() => setSelectedId(r.id)}
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight={700}>{r.name}</Typography>
                              {protectedRole ? (
                                <Chip
                                  size="small"
                                  color="warning"
                                  label="Fixo"
                                  variant="outlined"
                                  icon={<LockRoundedIcon fontSize="small" />}
                                />
                              ) : (
                                <Chip size="small" color="success" label="Personalizado" variant="outlined" />
                              )}
                            </Stack>
                          }
                          secondary={`${r.code} · ${r.permission_count ?? r.permissions?.length ?? 0} permissões`}
                        />
                        <Tooltip title={protectedRole ? 'Grupo do sistema (read-only)' : 'Editar'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={protectedRole}
                              onClick={(e) => {
                                e.stopPropagation()
                                openEdit(r)
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={protectedRole ? 'Grupo do sistema não pode ser excluído' : 'Excluir'}
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={protectedRole}
                              onClick={(e) => {
                                e.stopPropagation()
                                setToDelete(r)
                              }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ListItemButton>
                      <Divider component="li" />
                    </Box>
                  )
                })}
              </List>
            </Card>
          </Grid>

          {/* Direita: permissões do grupo selecionado */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 2.5 }}>
              {permissionsQuery.isLoading ? (
                <LoadingState />
              ) : permissionsQuery.isError ? (
                <ErrorState
                  message={errorMessage(permissionsQuery.error)}
                  onRetry={permissionsQuery.refetch}
                />
              ) : effectiveSelectedId ? (
                <PermissionsPanel
                  key={effectiveSelectedId}
                  roleId={effectiveSelectedId}
                  permissions={permissions}
                />
              ) : (
                <EmptyState
                  icon={<AdminPanelSettingsRoundedIcon />}
                  title="Selecione um grupo"
                  description="Escolha um grupo à esquerda para ver e editar suas permissões."
                />
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Catálogo de permissões (read-only) */}
      {permissions.length > 0 && (
        <Accordion sx={{ mt: 2 }} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography fontWeight={700}>Catálogo de permissões ({permissions.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {catalogGrouped.map(([mod, perms]) => (
                <Box key={mod}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                    {moduleLabel(mod)}
                  </Typography>
                  <Grid container spacing={1}>
                    {perms.map((p) => (
                      <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {p.subject}.{p.action}
                        </Typography>
                        {p.description && (
                          <Typography variant="caption" color="text.secondary">
                            {p.description}
                          </Typography>
                        )}
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {formOpen && <RoleFormDialog role={formRole} onClose={() => setFormOpen(false)} />}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir grupo"
        description={`Tem certeza que deseja excluir o grupo "${toDelete?.name}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
