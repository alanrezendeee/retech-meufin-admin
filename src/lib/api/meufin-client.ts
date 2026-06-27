import axios, { type AxiosInstance } from 'axios'

/**
 * Cliente HTTP da retech-meufin-api (domínio de negócio).
 * Separado do authClient: base URL própria (VITE_API_BASE_URL) e o mesmo
 * access_token do auth injetado via setMeufinAccessToken.
 *
 * O workspace NÃO é enviado por header — a API deriva do tenant_id do token.
 */
const meufinBaseURL = () => import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

export const meufinClient: AxiosInstance = axios.create({
  baseURL: meufinBaseURL(),
  headers: { 'Content-Type': 'application/json' },
})

export function setMeufinAccessToken(token: string | null): void {
  if (token) {
    meufinClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete meufinClient.defaults.headers.common.Authorization
  }
}
