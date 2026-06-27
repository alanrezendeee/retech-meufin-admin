import axios, { type AxiosInstance } from 'axios'
import type { LoginCredentials, User } from '@/types/auth'
import { RETECH_FIN_APPLICATION_CODE } from '@/constants/app'
import { mockAbilitiesForEmail, mockUserForEmail } from '@/auth/context/jwt/mock-auth'
import { setMeufinAccessToken } from '@/lib/api/meufin-client'
import { toUserMessage } from '@/lib/errors'

/** Formato CASL retornado por GET /v1/me (retechauth-api). */
export type CASLAbility = {
  action: string
  subject: string
  conditions?: Record<string, unknown>
}

export type MeResponse = {
  user: {
    id: string
    email: string
    name: string
  }
  application?: {
    id: string
    name: string
    code: string
    description?: string
  }
  roles?: unknown[]
  permissions?: unknown[]
  abilities: CASLAbility[]
}

export type AuthLoginResult = {
  user: User
  accessToken: string
  refreshToken: string
  abilities: CASLAbility[]
}

const authBaseURL = () => import.meta.env.VITE_AUTH_BASE_URL ?? 'http://localhost:8000'
const pathAuthenticate = () => import.meta.env.VITE_AUTH_ENDPOINT_AUTHENTICATE ?? '/v1/authenticate'
const pathMe = () => import.meta.env.VITE_AUTH_ENDPOINT_ME ?? '/v1/me'

function createAuthClient(): AxiosInstance {
  return axios.create({
    baseURL: authBaseURL(),
    headers: { 'Content-Type': 'application/json' },
  })
}

const authClient = createAuthClient()

export function setAuthAccessToken(token: string | null): void {
  if (token) {
    authClient.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete authClient.defaults.headers.common.Authorization
  }
  // Propaga o mesmo token para o cliente da meufin-api (mesmo SSO).
  setMeufinAccessToken(token)
}

function mapMeUserToUser(u: MeResponse['user']): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
  }
}

function getErrorMessage(err: unknown): string {
  return toUserMessage(err, 'default')
}

async function fetchMe(): Promise<MeResponse> {
  const { data } = await authClient.get<MeResponse>(pathMe())
  return data
}

const mockDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authService = {
  /**
   * POST /v1/authenticate no host do retechauth-api; em seguida GET /v1/me com o access_token.
   */
  async login(credentials: LoginCredentials): Promise<AuthLoginResult> {
    if (import.meta.env.VITE_AUTH_USE_MOCK === 'true') {
      await mockDelay(600)
      const user = mockUserForEmail(credentials.email)
      if (!user) {
        throw new Error('Usuário não encontrado')
      }
      if (credentials.email === 'demo@retechfin.com' && credentials.password !== 'demo123') {
        throw new Error('Senha incorreta')
      }
      const abilities = mockAbilitiesForEmail(credentials.email)
      const accessToken = `mock_access_${user.id}`
      const refreshToken = `mock_refresh_${user.id}`
      setAuthAccessToken(accessToken)
      return { user, accessToken, refreshToken, abilities }
    }

    const { data: authData } = await authClient.post<{
      access_token: string
      refresh_token: string
      token_type?: string
      expires_in?: number
      user?: MeResponse['user']
    }>(pathAuthenticate(), {
      email: credentials.email,
      password: credentials.password,
      application_code: RETECH_FIN_APPLICATION_CODE,
    })

    const accessToken = authData.access_token
    const refreshToken = authData.refresh_token
    setAuthAccessToken(accessToken)

    const me = await fetchMe()
    return {
      user: mapMeUserToUser(me.user),
      accessToken,
      refreshToken,
      abilities: me.abilities ?? [],
    }
  },

  /** GET /v1/me com o token já configurado em setAuthAccessToken. */
  async me(): Promise<MeResponse> {
    return fetchMe()
  },

  async logout(): Promise<void> {
    setAuthAccessToken(null)
  },

  getErrorMessage,
}

export { getErrorMessage as getAuthErrorMessage }
