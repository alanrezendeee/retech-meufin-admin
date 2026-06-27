import type { ErrorParseContext, ParsedUserError } from '@/lib/errors/types'
import { parseUserHttpError, toUserMessage } from '@/lib/errors/parse-http-error'

/**
 * Erro pensado para a UI: mensagem já sanitizada; metadados para toast, log ou suporte.
 */
export class UserFacingError extends Error {
  readonly httpStatus?: number
  readonly apiCode?: number
  readonly apiErrorKey?: string
  readonly isNetworkError: boolean
  readonly parsed: ParsedUserError

  constructor(parsed: ParsedUserError) {
    super(parsed.message)
    this.name = 'UserFacingError'
    this.parsed = parsed
    this.httpStatus = parsed.httpStatus
    this.apiCode = parsed.apiCode
    this.apiErrorKey = parsed.apiErrorKey
    this.isNetworkError = parsed.isNetworkError
  }

  static fromUnknown(error: unknown, context: ErrorParseContext = 'default'): UserFacingError {
    return new UserFacingError(parseUserHttpError(error, context))
  }

  static message(error: unknown, context: ErrorParseContext = 'default'): string {
    return toUserMessage(error, context)
  }
}
