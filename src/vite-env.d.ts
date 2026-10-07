/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `true` = login e sessão mockados (sem chamar a API). */
  readonly VITE_AUTH_USE_MOCK: string
  /**
   * Base da retech-meufin-api (negócio E autenticação por cookie). Vazia =
   * same-origin (nginx/Vite fazem proxy de /api/). Só preencher em deploy cross-origin.
   */
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  /** Dev: exibir mensagem da API em erros 5xx (não usar em produção). */
  readonly VITE_SHOW_API_5XX_DETAILS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
