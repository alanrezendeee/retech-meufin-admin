import { useQuery } from '@tanstack/react-query'
import { getMyAvatarUrl } from '@/lib/api/profile'

/** Chave de cache do avatar do usuário logado. */
export const myAvatarKey = ['my-avatar'] as const

/**
 * Avatar (foto de perfil) do usuário logado. URL presignada de 15min, então
 * mantemos um staleTime curto (10min) e refetch sob demanda via invalidate.
 */
export function useMyAvatar() {
  return useQuery({
    queryKey: myAvatarKey,
    queryFn: getMyAvatarUrl,
    staleTime: 10 * 60 * 1000,
  })
}
