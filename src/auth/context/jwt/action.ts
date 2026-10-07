import { authService } from '@/auth/services/auth.service'
import type { LoginCredentials } from '@/types/auth'
import type { AuthLoginResult } from '@/auth/services/auth.service'

/**
 * Login via meufin-api (cookie de sessão) ou mock via authService quando aplicável.
 * O estado em memória (usuário/abilities) fica no AuthProvider.
 */
export async function signInWithPassword(credentials: LoginCredentials): Promise<AuthLoginResult> {
  return authService.login(credentials)
}
