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
  { value: 'salario', label: 'Salário (CLT)' },
  { value: 'pj_contrato', label: 'Remuneração PJ (contrato)' },
  { value: 'pro_labore', label: 'Pró-labore' },
  { value: 'dividendos', label: 'Dividendos' },
  { value: 'rendimento', label: 'Rendimentos (juros/investimentos)' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'freela', label: 'Freela' },
  { value: 'ferias_13', label: '13º/Férias' },
  { value: 'beneficio', label: 'Benefício' },
  { value: 'reembolso', label: 'Reembolso' },
  { value: 'outro', label: 'Outro' },
]

/**
 * Semântica de cada tipo de receita — é isto que deixa o sistema "raciocinar"
 * sobre a renda no futuro (composição ativa×passiva, sazonalidade na projeção,
 * inteligência fiscal). Regra: o catálogo de tipos é curado (nunca livre) para
 * a semântica não degradar; a liberdade de nomes fica na Fonte de Receita.
 *
 *  - nature: 'ativa' (você trabalhando) | 'passiva' (dinheiro trabalhando) |
 *    'neutra' (não é renda de verdade — ex.: reembolso é estorno e deve ficar
 *    FORA dos indicadores de composição de renda)
 *  - seasonal: true = não recorre todo mês (projeção anual não deve linearizar)
 *  - regime: dica do tratamento tributário típico no Brasil (uso futuro)
 */
export type IncomeNature = 'ativa' | 'passiva' | 'neutra'
export const INCOME_TYPE_SEMANTICS: Record<
  IncomeType,
  { nature: IncomeNature; seasonal: boolean; regime: string }
> = {
  salario: { nature: 'ativa', seasonal: false, regime: 'clt_fonte' },
  pj_contrato: { nature: 'ativa', seasonal: false, regime: 'pj_simples' },
  pro_labore: { nature: 'ativa', seasonal: false, regime: 'pro_labore_inss' },
  dividendos: { nature: 'passiva', seasonal: false, regime: 'isento' },
  rendimento: { nature: 'passiva', seasonal: false, regime: 'ir_investimento' },
  aluguel: { nature: 'passiva', seasonal: false, regime: 'carne_leao' },
  freela: { nature: 'ativa', seasonal: true, regime: 'variavel' },
  ferias_13: { nature: 'ativa', seasonal: true, regime: 'clt_fonte' },
  beneficio: { nature: 'passiva', seasonal: false, regime: 'isento' },
  reembolso: { nature: 'neutra', seasonal: true, regime: 'nao_tributavel' },
  outro: { nature: 'ativa', seasonal: false, regime: 'indefinido' },
}

/** Tipo sugerido a partir do kind da Fonte de Receita (menos um clique, menos erro na origem). */
export const SOURCE_KIND_TO_INCOME_TYPE: Partial<Record<SourceKind, IncomeType>> = {
  clt: 'salario',
  pj: 'pj_contrato',
  freelance: 'freela',
  rental: 'aluguel',
  investment: 'rendimento',
  benefit: 'beneficio',
}

export const INCOME_TYPE_LABEL: Record<IncomeType, string> = INCOME_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<IncomeType, string>
)

/** Categoria da despesa (armazenada no campo `type` do lançamento). */
export const EXPENSE_CATEGORY_OPTIONS: Option<string>[] = [
  { value: 'moradia', label: 'Moradia' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'saude', label: 'Saúde' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'educacao', label: 'Educação' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'contas_fixas', label: 'Contas fixas' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'outros', label: 'Outros' },
]

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = EXPENSE_CATEGORY_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<string, string>
)

/** Bandeira/emissor do cartão (campo opcional `brand`). */
export const CARD_BRAND_OPTIONS: Option<string>[] = [
  { value: 'nubank', label: 'Nubank' },
  { value: 'inter', label: 'Inter' },
  { value: 'santander', label: 'Santander' },
  { value: 'itau', label: 'Itaú' },
  { value: 'bradesco', label: 'Bradesco' },
  { value: 'c6', label: 'C6' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'outro', label: 'Outro' },
]

export const CARD_BRAND_LABEL: Record<string, string> = CARD_BRAND_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<string, string>
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
  cards: () => [...financeKeys.all, 'cards'] as const,
  entries: (params: Record<string, unknown>) => [...financeKeys.all, 'entries', params] as const,
  invoices: (params: Record<string, unknown>) => [...financeKeys.all, 'invoices', params] as const,
  familyMembers: () => [...financeKeys.all, 'family-members'] as const,
  accounts: () => [...financeKeys.all, 'accounts'] as const,
  expenseCategories: () => [...financeKeys.all, 'expense-categories'] as const,
  receipts: (entryId: string) => [...financeKeys.all, 'receipts', entryId] as const,
  dashboard: (params: Record<string, unknown>) => [...financeKeys.all, 'dashboard', params] as const,
  dashboardMonthly: (params: Record<string, unknown>) =>
    [...financeKeys.all, 'dashboard-monthly', params] as const,
}

/** Extrai mensagem de erro amigável de erro axios/desconhecido. */
export function errorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (typeof err === 'object' && err != null) {
    const anyErr = err as {
      response?: { data?: { error?: string | { message?: string }; message?: string } }
      message?: string
    }
    // A API responde { error: { code, message, request_id } } — objeto, não string.
    // Devolver o objeto quebraria o React ("Objects are not valid as a React child").
    const apiErr = anyErr.response?.data?.error
    if (typeof apiErr === 'string' && apiErr) return apiErr
    if (apiErr && typeof apiErr === 'object' && typeof apiErr.message === 'string' && apiErr.message) {
      return apiErr.message
    }
    return anyErr.response?.data?.message ?? anyErr.message ?? fallback
  }
  return fallback
}

/** Tipo da conta (finance_accounts). */
export const ACCOUNT_KIND_OPTIONS: Option<import('./api').AccountKind>[] = [
  { value: 'corrente', label: 'Conta corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'carteira', label: 'Carteira / Dinheiro' },
  { value: 'digital', label: 'Conta digital' },
]

export const ACCOUNT_KIND_LABEL: Record<string, string> = ACCOUNT_KIND_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<string, string>
)

/** Forma de pagamento na liquidação. */
export const PAYMENT_METHOD_OPTIONS: Option<import('./api').PaymentMethod>[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'debito', label: 'Débito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
]

export const PAYMENT_METHOD_LABEL: Record<string, string> = PAYMENT_METHOD_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<string, string>
)

/** Formas que apontam para uma conta (as demais: dinheiro=nada, cartao_credito=cartão). */
export const ACCOUNT_PAYMENT_METHODS = ['pix', 'debito', 'transferencia', 'boleto'] as const
