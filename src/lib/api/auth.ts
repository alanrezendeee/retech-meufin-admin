/**
 * Autenticação RetechFin Admin → retechauth-api.
 * Implementação principal: `src/auth/services/auth.service.ts`.
 */
export { authClient, authService, setAuthAccessToken, getAuthErrorMessage } from '@/auth/services/auth.service'
export type { CASLAbility, MeResponse, AuthLoginResult } from '@/auth/services/auth.service'
