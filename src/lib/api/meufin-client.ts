import axios, { type AxiosInstance } from 'axios'

/**
 * Cliente HTTP da retech-meufin-api (domínio de negócio E autenticação).
 *
 * Autenticação é por cookie de sessão HttpOnly emitido pela própria API
 * (POST /api/v1/auth/login) — nenhum token passa pelo JavaScript, então
 * `withCredentials: true` é tudo que o cliente precisa. Em produção o nginx
 * do admin faz proxy de /api/ para a API (same-origin); em dev o Vite faz o
 * mesmo (vite.config.ts). VITE_API_BASE_URL só é necessária em deploy
 * cross-origin (ver docs/auth-session-gateway.md na API).
 *
 * O workspace NÃO é enviado por header — a API deriva do tenant_id do token.
 */
const meufinBaseURL = () => (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

/** Disparado em `window` quando a API responde 401 fora do fluxo de login. */
export const UNAUTHORIZED_EVENT = 'meufin:unauthorized'

const AUTH_PREFIX = '/api/v1/auth/'

/**
 * Converte 401 em evento global: o AuthProvider escuta e derruba a sessão
 * local (redirect para /login). O próprio fluxo de login/me é excluído para
 * não gerar ruído em "senha incorreta" ou no check inicial.
 */
export function attachUnauthorizedInterceptor(client: AxiosInstance): void {
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const url = error.config?.url ?? ''
        if (!url.includes(AUTH_PREFIX)) {
          window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
        }
      }
      return Promise.reject(error)
    }
  )
}

export const meufinClient: AxiosInstance = axios.create({
  baseURL: meufinBaseURL(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

attachUnauthorizedInterceptor(meufinClient)

/** Base absoluta/relativa da API (para montar outros clientes sob /api/v1/...). */
export function apiBaseURL(): string {
  return meufinBaseURL()
}
