import { authClient } from '@/lib/api/auth'

/**
 * API de Administração (IAM) — consome a retechauth-api sob VITE_AUTH_BASE_URL.
 * O Bearer (token master) já é injetado no `authClient` via setAuthAccessToken.
 * Endpoints sob /v1/users, /v1/roles e /v1/permissions.
 */

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type RoleRef = {
  id: string
  name: string
  code: string
  description?: string | null
}

export type Permission = {
  id: string
  code: string
  subject: string
  action: string
  description?: string | null
  active?: boolean
}

export type AdminUser = {
  id: string
  email: string
  name: string
  active: boolean
  roles: RoleRef[]
  permissions?: Permission[]
  abilities?: unknown[]
  version?: number
  created_at?: string
  updated_at?: string
}

export type ListUsersParams = {
  limit?: number
  offset?: number
  email?: string
  name?: string
  active?: boolean
  role?: string
}

export type ListUsersResponse = {
  users: AdminUser[]
  total: number
  limit: number
  offset: number
}

export type CreateUserInput = {
  email: string
  password: string
  name: string
  role_ids: string[]
}

export type Role = {
  id: string
  name: string
  code: string
  description?: string | null
  system?: boolean
  active?: boolean
  permission_count?: number
  permissions?: Permission[]
  created_at?: string
  updated_at?: string
}

export type ListRolesParams = {
  active?: boolean
  include_permissions?: boolean
}

export type ListRolesResponse = {
  roles: Role[]
  total: number
}

export type CreateRoleInput = {
  name: string
  code: string
  description?: string | null
  system?: boolean
  permission_ids?: string[]
}

export type UpdateRoleInput = {
  name: string
  description?: string | null
  active: boolean
  permission_ids?: string[]
}

export type ListPermissionsResponse = {
  permissions: Permission[]
  total: number
}

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

export async function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponse> {
  const { data } = await authClient.get<ListUsersResponse>('/v1/users', { params })
  return data
}

export async function getUser(id: string): Promise<AdminUser> {
  const { data } = await authClient.get<AdminUser>(`/v1/users/${id}`)
  return data
}

export async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const { data } = await authClient.post<AdminUser>('/v1/users', input)
  return data
}

export async function updateUser(
  id: string,
  input: { name: string; version?: number }
): Promise<AdminUser> {
  const { data } = await authClient.put<AdminUser>(`/v1/users/${id}`, input)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await authClient.delete(`/v1/users/${id}`)
}

export async function setUserRoles(
  id: string,
  input: { role_ids: string[]; version?: number }
): Promise<{ user_id: string; roles: RoleRef[]; version: number; updated_at?: string }> {
  const { data } = await authClient.put(`/v1/users/${id}/roles`, input)
  return data
}

export async function setUserStatus(
  id: string,
  input: { active: boolean; version?: number }
): Promise<AdminUser> {
  const { data } = await authClient.patch<AdminUser>(`/v1/users/${id}/status`, input)
  return data
}

export async function resetUserPassword(
  id: string,
  input: { new_password: string; version?: number }
): Promise<{ message: string }> {
  const { data } = await authClient.post<{ message: string }>(
    `/v1/users/${id}/password/reset`,
    input
  )
  return data
}

// ---------------------------------------------------------------------------
// Grupos (roles)
// ---------------------------------------------------------------------------

export async function listRoles(params: ListRolesParams = {}): Promise<ListRolesResponse> {
  const { data } = await authClient.get<ListRolesResponse>('/v1/roles', { params })
  return data
}

export async function getRole(id: string): Promise<Role> {
  const { data } = await authClient.get<Role>(`/v1/roles/${id}`)
  return data
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  const { data } = await authClient.post<Role>('/v1/roles', input)
  return data
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
  const { data } = await authClient.put<Role>(`/v1/roles/${id}`, input)
  return data
}

export async function setRolePermissions(
  id: string,
  input: { permission_codes: string[] }
): Promise<{ role_id: string; permissions: Permission[] }> {
  const { data } = await authClient.put(`/v1/roles/${id}/permissions`, input)
  return data
}

export async function deleteRole(id: string): Promise<void> {
  await authClient.delete(`/v1/roles/${id}`)
}

// ---------------------------------------------------------------------------
// Permissões (catálogo)
// ---------------------------------------------------------------------------

export async function listPermissions(): Promise<ListPermissionsResponse> {
  const { data } = await authClient.get<ListPermissionsResponse>('/v1/permissions')
  return data
}
