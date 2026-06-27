/**
 * Erros para o usuário final — PT-BR, reutilizável em qualquer cliente HTTP (auth, fin, etc.).
 *
 * Abordagem:
 * - A API continua sendo a fonte da verdade para erros de negócio (campo `message`), em português.
 * - O front normaliza: prioriza `message`/`detail` do JSON; evita exibir a frase genérica do Axios;
 *   mapeia status HTTP quando o corpo falha; trata rede/timeout; em 5xx usa mensagem genérica (segurança).
 *
 * Uso:
 *   `setError(UserFacingError.message(err, 'login'))`
 *   ou `throw UserFacingError.fromUnknown(err, 'session')`
 */
export type { ApiErrorBody, ErrorParseContext, ParsedUserError } from '@/lib/errors/types'
export {
  HTTP_STATUS_USER_MESSAGES,
  HTTP_STATUS_LOGIN_MESSAGES,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from '@/lib/errors/http-status-messages'
export { parseUserHttpError, toUserMessage } from '@/lib/errors/parse-http-error'
export { UserFacingError } from '@/lib/errors/user-facing-error'
