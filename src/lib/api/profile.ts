import { meufinClient } from '@/lib/api/meufin-client'

/**
 * Perfil do usuário logado (retech-meufin-api, grupo /api/v1/me).
 * Apenas autenticado (sem módulo). O workspace vem do token.
 */
const BASE = '/api/v1/me'

/** URL presignada (15min) do avatar do usuário, ou null se não houver. */
export async function getMyAvatarUrl(): Promise<string | null> {
  const { data } = await meufinClient.get<{ avatar_url: string | null }>(`${BASE}/avatar-url`)
  return data.avatar_url ?? null
}

/** Envia a foto de perfil (blob já recortado, JPEG 512×512). Retorna a nova URL. */
export async function uploadMyAvatar(blob: Blob): Promise<string | null> {
  const form = new FormData()
  form.append('file', blob, 'avatar.jpg')
  const { data } = await meufinClient.post<{ avatar_url: string | null }>(`${BASE}/avatar`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.avatar_url ?? null
}

/** Remove a foto de perfil. */
export async function deleteMyAvatar(): Promise<void> {
  await meufinClient.delete(`${BASE}/avatar`)
}
