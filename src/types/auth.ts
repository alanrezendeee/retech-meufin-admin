export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  /** Campos legados / futuros domínio RetechFin (não vêm do retechauth-api hoje). */
  role?: 'admin' | 'member'
  familyId?: string
  familyName?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
