/**
 * Autenticação do admin → retech-meufin-api (gateway de sessão por cookie).
 * Implementação principal: `src/auth/services/auth.service.ts`.
 */
export { authClient, authService, getAuthErrorMessage } from '@/auth/services/auth.service'
export type { CASLAbility, MeResponse, AuthLoginResult } from '@/auth/services/auth.service'
