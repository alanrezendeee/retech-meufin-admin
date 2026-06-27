/**
 * Corpo de erro comum das APIs Retech (ex.: retechauth-api — Gin respondWithError).
 * Evolui para RFC 7807 (application/problem+json) no futuro sem quebrar o parser.
 */
export type ApiErrorBody = {
  error?: string
  message?: string
  code?: number
  /** Campos opcionais para problem+json / outras APIs */
  title?: string
  detail?: string
  instance?: string
}

export type ErrorParseContext = 'login' | 'session' | 'default'

export type ParsedUserError = {
  /** Texto seguro para exibir ao usuário (PT-BR). */
  message: string
  httpStatus?: number
  /** Código numérico do corpo JSON, quando existir. */
  apiCode?: number
  /** Identificador curto da API (campo `error`), útil para logs. */
  apiErrorKey?: string
  /** Sem resposta HTTP (rede, timeout, CORS). */
  isNetworkError: boolean
}
