import axios, { type AxiosError } from 'axios'
import type { ApiErrorBody, ErrorParseContext, ParsedUserError } from '@/lib/errors/types'
import {
  HTTP_STATUS_LOGIN_MESSAGES,
  HTTP_STATUS_USER_MESSAGES,
  NETWORK_ERROR_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  UNKNOWN_ERROR_MESSAGE,
} from '@/lib/errors/http-status-messages'

const GENERIC_AXIOS_MESSAGE = /^Request failed with status code \d+$/i

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asApiErrorBody(data: unknown): ApiErrorBody | undefined {
  if (!isRecord(data)) {
    return undefined
  }
  return data as ApiErrorBody
}

function pickMessageFromBody(body: ApiErrorBody | undefined): string | undefined {
  if (!body) {
    return undefined
  }
  const m = body.message ?? body.detail ?? body.title
  if (typeof m === 'string') {
    const t = m.trim()
    return t.length > 0 ? t : undefined
  }
  return undefined
}

function statusTable(context: ErrorParseContext): Record<number, string> {
  return context === 'login' ? HTTP_STATUS_LOGIN_MESSAGES : HTTP_STATUS_USER_MESSAGES
}

function messageForHttpStatus(status: number, context: ErrorParseContext): string {
  const table = statusTable(context)
  return table[status] ?? UNKNOWN_ERROR_MESSAGE
}

/**
 * Define se a mensagem vinda da API pode ser mostrada ao usuário.
 * 5xx: em produção usamos texto genérico (evita vazar detalhes internos); em dev pode exibir a API.
 */
function shouldUseApiMessageForStatus(status: number): boolean {
  if (status >= 500) {
    return import.meta.env.DEV && import.meta.env.VITE_SHOW_API_5XX_DETAILS === 'true'
  }
  return true
}

function normalizeClientMessage(msg: string): string | undefined {
  const t = msg.trim()
  if (t.length === 0 || GENERIC_AXIOS_MESSAGE.test(t)) {
    return undefined
  }
  return t
}

/**
 * Interpreta falhas de HTTP (Axios) ou `Error` genérico e devolve texto único para UI.
 */
export function parseUserHttpError(
  error: unknown,
  context: ErrorParseContext = 'default'
): ParsedUserError {
  if (axios.isCancel(error)) {
    return {
      message: 'Operação cancelada.',
      isNetworkError: false,
    }
  }

  if (axios.isAxiosError(error)) {
    return parseAxiosError(error, context)
  }

  if (error instanceof Error) {
    const friendly = normalizeClientMessage(error.message)
    return {
      message: friendly ?? UNKNOWN_ERROR_MESSAGE,
      isNetworkError: false,
    }
  }

  return {
    message: UNKNOWN_ERROR_MESSAGE,
    isNetworkError: false,
  }
}

function parseAxiosError(err: AxiosError<unknown>, context: ErrorParseContext): ParsedUserError {
  const status = err.response?.status
  const body = asApiErrorBody(err.response?.data)
  const apiMessage = pickMessageFromBody(body)
  const apiCode = typeof body?.code === 'number' ? body.code : undefined
  const apiErrorKey = typeof body?.error === 'string' ? body.error : undefined

  if (status === undefined) {
    if (err.code === 'ECONNABORTED') {
      return { message: TIMEOUT_ERROR_MESSAGE, isNetworkError: true }
    }
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return { message: NETWORK_ERROR_MESSAGE, isNetworkError: true }
    }
    const fallback = normalizeClientMessage(err.message)
    return {
      message: fallback ?? NETWORK_ERROR_MESSAGE,
      isNetworkError: true,
    }
  }

  let message: string
  if (apiMessage && shouldUseApiMessageForStatus(status)) {
    message = apiMessage
  } else {
    message = messageForHttpStatus(status, context)
  }

  return {
    message,
    httpStatus: status,
    apiCode,
    apiErrorKey,
    isNetworkError: false,
  }
}

/** Atalho para telas e catch blocks. */
export function toUserMessage(error: unknown, context: ErrorParseContext = 'default'): string {
  return parseUserHttpError(error, context).message
}
