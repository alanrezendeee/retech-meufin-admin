import type { EntryStatus, IncomeType, Recurrence, SourceKind } from './api'

type Option<T extends string> = { value: T; label: string }

/** Tipo (kind) da fonte de receita. */
export const SOURCE_KIND_OPTIONS: Option<SourceKind>[] = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'freelance', label: 'Projeto avulso' },
  { value: 'rental', label: 'Aluguel' },
  { value: 'investment', label: 'Investimento' },
  { value: 'benefit', label: 'Benefício' },
  { value: 'other', label: 'Outro' },
]

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = SOURCE_KIND_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<SourceKind, string>
)

/** Tipo da receita (natureza do lançamento). */
export const INCOME_TYPE_OPTIONS: Option<IncomeType>[] = [
  { value: 'salario', label: 'Salário' },
  { value: 'pro_labore', label: 'Pró-labore' },
  { value: 'dividendos', label: 'Dividendos' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'freela', label: 'Freela' },
  { value: 'ferias_13', label: '13º/Férias' },
  { value: 'beneficio', label: 'Benefício' },
  { value: 'reembolso', label: 'Reembolso' },
  { value: 'outro', label: 'Outro' },
]

export const INCOME_TYPE_LABEL: Record<IncomeType, string> = INCOME_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<IncomeType, string>
)

/** Recorrência do lançamento. */
export const RECURRENCE_OPTIONS: Option<Recurrence>[] = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
]

export const RECURRENCE_LABEL: Record<Recurrence, string> = RECURRENCE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<Recurrence, string>
)

/** Situação do lançamento. */
export const ENTRY_STATUS_OPTIONS: Option<EntryStatus>[] = [
  { value: 'prevista', label: 'Prevista' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
]

export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = ENTRY_STATUS_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<EntryStatus, string>
)

/** Cor do chip por status (MUI color). */
export const ENTRY_STATUS_COLOR: Record<EntryStatus, 'default' | 'warning' | 'success' | 'error'> =
  {
    prevista: 'warning',
    realizada: 'success',
    cancelada: 'error',
  }

export const MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

/** Lista de anos (ano atual +/- 2) para o filtro. */
export function yearOptions(base: number = new Date().getFullYear()): number[] {
  return [base - 2, base - 1, base, base + 1, base + 2]
}

/** react-query keys centralizados. */
export const financeKeys = {
  all: ['finance'] as const,
  incomeSources: () => [...financeKeys.all, 'income-sources'] as const,
  entries: (params: Record<string, unknown>) => [...financeKeys.all, 'entries', params] as const,
  familyMembers: () => [...financeKeys.all, 'family-members'] as const,
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
