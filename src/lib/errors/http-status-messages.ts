/**
 * Mensagens padrão quando o corpo da resposta não traz `message` ou não deve ser exibido (ex.: 5xx).
 */
export const HTTP_STATUS_USER_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Verifique as informações e tente novamente.',
  401: 'Sessão inválida ou expirada. Faça login novamente.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Recurso não encontrado.',
  408: 'A operação demorou demais. Tente novamente.',
  409: 'Conflito com o estado atual. Atualize a página e tente de novo.',
  422: 'Não foi possível processar os dados enviados.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  500: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  502: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  503: 'Serviço em manutenção. Tente novamente em instantes.',
  504: 'O servidor não respondeu a tempo. Tente novamente.',
}

/** Login: 401 costuma ser credenciais, não “sessão expirada”. */
export const HTTP_STATUS_LOGIN_MESSAGES: Record<number, string> = {
  ...HTTP_STATUS_USER_MESSAGES,
  401: 'E-mail ou senha incorretos. Verifique e tente novamente.',
}

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua internet e se o serviço está disponível.'

export const TIMEOUT_ERROR_MESSAGE =
  'A conexão expirou. Verifique sua rede e tente novamente.'

export const UNKNOWN_ERROR_MESSAGE = 'Algo deu errado. Tente novamente em instantes.'
