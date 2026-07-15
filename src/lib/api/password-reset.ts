import { meufinClient } from '@/lib/api/meufin-client'

/**
 * Fluxo público "esqueci a senha" (retech-meufin-api, sem autenticação).
 * A API responde sempre 202 no request — nunca revela se o e-mail existe.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await meufinClient.post('/api/v1/public/password-reset/request', { email })
}

export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  await meufinClient.post('/api/v1/public/password-reset/confirm', { token, password })
}
