/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL do retechauth-api (ex.: http://localhost:8080) — sem path de versão. */
  readonly VITE_AUTH_BASE_URL: string
  readonly VITE_AUTH_ENDPOINT_AUTHENTICATE: string
  readonly VITE_AUTH_ENDPOINT_ME: string
  /** `true` = login e sessão mockados (sem chamar a API de auth). */
  readonly VITE_AUTH_USE_MOCK: string
  /** Base da retechfin-api (dispositivos, eventos, etc.) — não usar no fluxo de login. */
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  /** Dev: exibir mensagem da API em erros 5xx (não usar em produção). */
  readonly VITE_SHOW_API_5XX_DETAILS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
