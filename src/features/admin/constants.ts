/** react-query keys centralizados do módulo de Administração (IAM). */
export const adminKeys = {
  all: ['admin'] as const,
  users: (params: Record<string, unknown>) => [...adminKeys.all, 'users', params] as const,
  user: (id: string) => [...adminKeys.all, 'user', id] as const,
  roles: (params: Record<string, unknown>) => [...adminKeys.all, 'roles', params] as const,
  role: (id: string) => [...adminKeys.all, 'role', id] as const,
  permissions: () => [...adminKeys.all, 'permissions'] as const,
}

/** Extrai mensagem de erro amigável de erro axios/desconhecido. */
export function errorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (typeof err === 'object' && err != null) {
    const anyErr = err as {
      response?: { data?: { error?: string; message?: string } }
      message?: string
    }
    return (
      anyErr.response?.data?.error ?? anyErr.response?.data?.message ?? anyErr.message ?? fallback
    )
  }
  return fallback
}

/** Um role/usuário é protegido (system/master) — ações destrutivas desabilitadas na UI. */
export function isProtectedRole(role: { system?: boolean; code?: string }): boolean {
  return Boolean(role.system) || role.code === 'master'
}

/** Rótulos amigáveis por módulo (prefixo do subject antes do ponto). */
export const MODULE_LABEL: Record<string, string> = {
  finance: 'Financeiro',
  health: 'Saúde Familiar',
  admin: 'Administração',
  retechfin: 'RetechFin',
}

/** Deriva o módulo (prefixo antes do ponto) a partir do subject de uma permissão. */
export function moduleOf(subject: string): string {
  const idx = subject.indexOf('.')
  return idx >= 0 ? subject.slice(0, idx) : subject
}

/** Rótulo amigável do módulo (com fallback para o próprio prefixo). */
export function moduleLabel(mod: string): string {
  return MODULE_LABEL[mod] ?? mod.charAt(0).toUpperCase() + mod.slice(1)
}
