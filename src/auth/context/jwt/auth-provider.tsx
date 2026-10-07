import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginCredentials, User } from '@/types/auth'
import { authService, type AuthLoginResult } from '@/auth/services/auth.service'
import { signInWithPassword } from '@/auth/context/jwt/action'
import { buildAbility, type AppAbility } from '@/auth/casl/ability'
import { AbilityProvider } from '@/auth/casl/ability-context'
import { UNAUTHORIZED_EVENT } from '@/lib/api/meufin-client'

/**
 * Sessão do admin.
 *
 * Não há token no browser: a API mantém a sessão em cookie HttpOnly
 * (docs/auth-session-gateway.md na meufin-api). Aqui só vive o estado em
 * memória (usuário + abilities), reidratado via GET /api/v1/auth/me a cada
 * carga da página. Um 401 em qualquer chamada derruba o estado local
 * (evento UNAUTHORIZED_EVENT) e o RequireAuth redireciona para /login.
 */

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkUserSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ability, setAbility] = useState<AppAbility | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const applySession = useCallback((result: AuthLoginResult | null) => {
    if (!result) {
      setUser(null)
      setAbility(undefined)
      return
    }
    setUser(result.user)
    setAbility(buildAbility(result.abilities))
  }, [])

  const checkUserSession = useCallback(async () => {
    try {
      applySession(await authService.me())
    } catch {
      // 401 (sem sessão) ou API fora: trata como deslogado.
      applySession(null)
    } finally {
      setIsInitialized(true)
    }
  }, [applySession])

  useEffect(() => {
    void checkUserSession()
  }, [checkUserSession])

  // Sessão expirou/revogada no servidor (401 em qualquer chamada): limpa local.
  useEffect(() => {
    const onUnauthorized = () => applySession(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [applySession])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoading(true)
      try {
        applySession(await signInWithPassword(credentials))
      } finally {
        setIsLoading(false)
      }
    },
    [applySession]
  )

  const logout = useCallback(async () => {
    await authService.logout()
    applySession(null)
    setIsInitialized(true)
  }, [applySession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isInitialized,
      login,
      logout,
      checkUserSession,
    }),
    [user, isLoading, isInitialized, login, logout, checkUserSession]
  )

  const abilityForTree = ability ?? buildAbility([])

  return (
    <AuthContext.Provider value={value}>
      <AbilityProvider value={abilityForTree}>{children}</AbilityProvider>
    </AuthContext.Provider>
  )
}
