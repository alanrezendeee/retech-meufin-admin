import axios, { type AxiosInstance } from 'axios'
import type { LoginCredentials, User } from '@/types/auth'
import { mockAbilitiesForEmail, mockUserForEmail } from '@/auth/context/jwt/mock-auth'
import { apiBaseURL, attachUnauthorizedInterceptor, meufinClient } from '@/lib/api/meufin-client'
import { toUserMessage } from '@/lib/errors'

/** Formato CASL retornado por GET /v1/me (retechauth-api), repassado pela meufin-api. */
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

/** Resultado do login já normalizado para o app. Não há tokens: a sessão vive em cookie HttpOnly. */
export type AuthLoginResult = {
  user: User
  abilities: CASLAbility[]
}

const AUTH_BASE = '/api/v1/auth'

/**
 * Cliente das telas de administração (IAM: usuários, roles, permissions).
 * Fala com a meufin-api em /api/v1/iam/*, que repassa ao retechauth-api
 * injetando o token da sessão no servidor — o browser nunca vê o JWT.
 * Os paths continuam os do auth (`/v1/users`, `/v1/roles`, ...).
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: `${apiBaseURL()}/api/v1/iam`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})
attachUnauthorizedInterceptor(authClient)

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
  const { data } = await meufinClient.get<MeResponse>(`${AUTH_BASE}/me`)
  return data
}

// ---------------------------------------------------------------------------
// Mock (VITE_AUTH_USE_MOCK=true): sem API. Só o e-mail fica em sessionStorage
// (morre ao fechar a aba); nunca há token envolvido.
// ---------------------------------------------------------------------------
const MOCK_KEY = 'meufin-admin-mock-user'
const isMock = () => import.meta.env.VITE_AUTH_USE_MOCK === 'true'
const mockDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function readMockEmail(): string | null {
  try {
    return sessionStorage.getItem(MOCK_KEY)
  } catch {
    return null
  }
}

function mockResult(email: string): AuthLoginResult | null {
  const user = mockUserForEmail(email)
  if (!user) {
    return null
  }
  return { user, abilities: [...mockAbilitiesForEmail(email)] }
}

export const authService = {
  /**
   * POST /api/v1/auth/login (emite o cookie de sessão) e, em seguida,
   * GET /api/v1/auth/me para usuário + abilities.
   */
  async login(credentials: LoginCredentials): Promise<AuthLoginResult> {
    if (isMock()) {
      await mockDelay(600)
      const result = mockResult(credentials.email)
      if (!result) {
        throw new Error('Usuário não encontrado')
      }
      if (credentials.email === 'demo@retechfin.com' && credentials.password !== 'demo123') {
        throw new Error('Senha incorreta')
      }
      try {
        sessionStorage.setItem(MOCK_KEY, credentials.email)
      } catch {
        /* sessionStorage indisponível: sessão mock só em memória */
      }
      return result
    }

    await meufinClient.post(`${AUTH_BASE}/login`, {
      email: credentials.email,
      password: credentials.password,
    })

    const me = await fetchMe()
    return {
      user: mapMeUserToUser(me.user),
      abilities: me.abilities ?? [],
    }
  },

  /**
   * Sessão atual (cookie). Lança (401) se não houver sessão válida.
   * Em mock, devolve o usuário salvo na aba ou null.
   */
  async me(): Promise<AuthLoginResult | null> {
    if (isMock()) {
      const email = readMockEmail()
      return email ? mockResult(email) : null
    }
    const me = await fetchMe()
    return {
      user: mapMeUserToUser(me.user),
      abilities: me.abilities ?? [],
    }
  },

  /** POST /api/v1/auth/logout revoga a sessão no servidor e limpa o cookie. */
  async logout(): Promise<void> {
    if (isMock()) {
      try {
        sessionStorage.removeItem(MOCK_KEY)
      } catch {
        /* noop */
      }
      return
    }
    try {
      await meufinClient.post(`${AUTH_BASE}/logout`)
    } catch {
      // Sem rede/API fora: o estado local é descartado mesmo assim; o cookie
      // expira sozinho e a sessão é revogada no próximo logout bem-sucedido.
    }
  },

  getErrorMessage,
}

export { getErrorMessage as getAuthErrorMessage }
