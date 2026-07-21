import { meufinClient } from '@/lib/api/meufin-client'

/**
 * API do módulo Financeiro (retech-meufin-api).
 * Endpoints sob VITE_API_BASE_URL + /api/v1/finance.
 * O Bearer já é injetado pelo meufinClient; o workspace vem do token (sem header).
 *
 * Convenção de dinheiro: o backend trabalha em CENTAVOS (inteiro). Na UI trabalhamos
 * em reais e convertemos na fronteira (ver helpers `centsToReais` / `reaisToCents`).
 */
const BASE = '/api/v1/finance'
const HEALTH_BASE = '/api/v1/health'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Paginated<T> = { items: T[]; total: number }

export type SourceKind =
  | 'clt'
  | 'pj'
  | 'freelance'
  | 'rental'
  | 'investment'
  | 'benefit'
  | 'other'

export type IncomeSource = {
  id: string
  name: string
  kind: SourceKind
  active: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type IncomeSourceInput = {
  name: string
  kind: SourceKind
  active: boolean
  notes?: string | null
}

export type CreditCard = {
  id: string
  name: string
  /** Bandeira: slug do catálogo global (visa, mastercard, elo...). */
  brand?: string | null
  /** Banco/instituição emissora (nubank, itau...). */
  bank?: string | null
  closing_day?: number | null
  due_day?: number | null
  active: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type CreditCardInput = {
  name: string
  brand?: string | null
  bank?: string | null
  closing_day?: number | null
  due_day?: number | null
  active: boolean
  notes?: string | null
}

/** Bandeira de cartão — catálogo global fixo servido pela API. */
export type CardBrand = {
  slug: string
  name: string
}

export type EntryKind = 'credit' | 'debit'
export type EntryStatus = 'prevista' | 'realizada' | 'cancelada'
export type IncomeType =
  | 'salario'
  | 'pj_contrato'
  | 'pro_labore'
  | 'dividendos'
  | 'rendimento'
  | 'aluguel'
  | 'freela'
  | 'ferias_13'
  | 'beneficio'
  | 'reembolso'
  | 'outro'
export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly'

export type Entry = {
  id: string
  kind: EntryKind
  status: EntryStatus
  amount_cents: number
  due_date: string // "YYYY-MM-DD"
  family_member_id?: string | null
  source_id?: string | null
  card_id?: string | null
  parent_id?: string | null
  installment_number?: number | null
  installment_total?: number | null
  type?: IncomeType | null
  description: string
  recurrence: Recurrence
  recurrence_group_id?: string | null
  notes?: string | null
  paid_at?: string | null
  paid_amount_cents?: number | null
  payment_method?: PaymentMethod | null
  payment_account_id?: string | null
  payment_card_id?: string | null
  discount_cents?: number | null
  discount_reason?: string | null
  /** Preenchido quando este lançamento é o saldo não pago de um pagamento parcial. */
  residual_of_id?: string | null
  /** Data em que a compra foi realizada (itens de fatura); vencimento é sempre o da fatura. */
  purchase_date?: string | null
  /** Cupom/nota fiscal vinculado (detalhamento item a item). */
  fiscal_document_id?: string | null
  supplier_id?: string | null
  created_at?: string
  updated_at?: string
}

/** Motivo de desconto — catálogo global fixo servido pela API. */
export type DiscountReason = {
  slug: string
  name: string
  description: string
}

export type EntryInput = {
  kind: EntryKind
  status: EntryStatus
  amount_cents: number
  due_date: string
  family_member_id?: string | null
  source_id?: string | null
  card_id?: string | null
  parent_id?: string | null
  installments_total?: number | null
  type?: IncomeType | null
  description: string
  recurrence: Recurrence
  recurrence_group_id?: string | null
  notes?: string | null
  supplier_id?: string | null
  /** Data da compra (YYYY-MM-DD, itens de fatura). */
  purchase_date?: string | null
  /** Parcela da compra em fatura (update): ausente preserva; 0 limpa. */
  installment_number?: number
  installment_total?: number
  /**
   * Update em série: 'future' propaga dia do vencimento, valor, descrição e
   * categoria às ocorrências previstas futuras da recorrência. Default 'one'.
   */
  apply_to?: 'one' | 'future'
  /** Lançamento retroativo: ocorrências vencidas nascem realizadas. */
  confirm_past_occurrences?: boolean
}

export type ListEntriesParams = {
  query?: string
  kind?: EntryKind
  status?: EntryStatus
  family_member_id?: string
  type?: IncomeType
  card_id?: string
  parent_id?: string
  top_level?: boolean
  year?: number
  month?: number
  due_on?: string
  due_from?: string
  due_to?: string
  overdue?: boolean
  supplier_id?: string
  limit?: number
  offset?: number
}

/** Membro da família (subset usado para atribuição de receitas). */
export type FamilyMemberLite = {
  id: string
  full_name: string
}

// ---------------------------------------------------------------------------
// Documentos / Importação de fatura por PDF + LLM
// ---------------------------------------------------------------------------

/** Documento (PDF/imagem) enviado para extração de fatura. */
export type FinanceDocument = {
  id: string
  card_id?: string | null
  entry_id?: string | null
  file_name?: string
  original_file_name?: string
  extraction_status?: ExtractionStatusValue
  filename?: string | null
  content_type?: string | null
  created_at?: string
  updated_at?: string
}

/** Status da extração assíncrona via LLM. */
export type ExtractionStatusValue = 'pending' | 'processing' | 'completed' | 'failed'

/** Compra sugerida pela extração (valores em CENTAVOS, como vêm do backend). */
export type PurchaseSuggestion = {
  description: string
  amount_cents: number
  date?: string | null
  category?: string | null
  installment_number?: number | null
  installment_total?: number | null
  raw_text?: string | null
}

/** Item de cupom/nota fiscal sugerido pela extração (centavos; qty em milésimos). */
export type FiscalItemSuggestion = {
  description: string
  quantity_milli: number
  unit_cents: number
  amount_cents: number
  /** Slug da categoria sugerida (validada contra o catálogo da tenant). */
  category?: string | null
  /** Nome de exibição da categoria (usado quando `category_is_new`). */
  category_name?: string | null
  /** Grupo global ao qual a categoria pertence. */
  category_group?: string | null
  /** true = categoria ainda não existe na tenant (sugestão a confirmar). */
  category_is_new?: boolean
  /** Unidade de medida (kg, un, L…) quando disponível. */
  unit?: string | null
  raw_text?: string | null
}

/** Cupom/nota fiscal estruturado sugerido pela extração. */
export type FiscalSuggestion = {
  merchant?: string
  cnpj?: string
  date?: string // YYYY-MM-DD
  total_cents: number
  items: FiscalItemSuggestion[]
  warnings?: string[]
}

/** Pagamento/estorno/crédito do ciclo (não é compra). Valor absoluto em centavos. */
export type InvoiceCreditSuggestion = {
  description: string
  date?: string | null
  amount_cents: number
}

/** Agregados da fatura p/ reconciliação: total a pagar, fatura anterior, créditos. */
export type InvoiceMetaSuggestion = {
  total_cents?: number | null
  previous_balance_cents?: number | null
  credits: InvoiceCreditSuggestion[]
}

/** Procedência do detalhamento fiscal: verificado na Receita ou lido por IA. */
export type FiscalSource = 'sefaz' | 'ocr_llm'

/** Retorno do endpoint de status de extração. */
export type ExtractionStatus = {
  status: ExtractionStatusValue
  provider?: string | null
  error_message?: string | null
  started_at?: string | null
  finished_at?: string | null
  purchases?: PurchaseSuggestion[]
  invoice?: InvoiceMetaSuggestion | null
  fiscal?: FiscalSuggestion | null
  /** Procedência do detalhamento fiscal (só em documentos fiscais extraídos). */
  fiscal_source?: FiscalSource | null
}

/** Item de cupom/nota fiscal persistido, vinculado a uma despesa. */
export type FiscalItem = {
  id: string
  entry_id: string
  document_id: string
  description: string
  quantity_milli: number
  unit_cents: number
  amount_cents: number
  category?: string | null
}

/** Payload de confirmação do cupom: vincula a despesa existente OU cria nova. */
export type ConfirmFiscalPayload = {
  entry_id?: string
  new_entry?: {
    description: string
    amount_cents: number
    due_date: string // YYYY-MM-DD
    status?: 'prevista' | 'realizada'
    type?: string | null
    family_member_id?: string | null
    supplier_id?: string | null
    purchase_date?: string | null
  }
  items: Array<{
    description: string
    quantity_milli: number
    unit_cents: number
    amount_cents: number
    category?: string | null
    /** Nome e grupo acompanham categorias NOVAS (auto-cadastro no save). */
    category_name?: string | null
    category_group?: string | null
    /** Unidade de medida (kg, un, L…) do item. */
    unit?: string | null
  }>
}

/** Categoria auto-cadastrada durante o fiscal-confirm (para avisar o usuário). */
export type CreatedCategory = { slug: string; name: string; group: string }

/** Item da fatura no confirm — dinheiro trafega como inteiro de CENTAVOS (regra do sistema). */
export type ConfirmInvoiceItem = {
  description: string
  amount_cents: number // CENTAVOS (inteiro)
  date?: string | null // "YYYY-MM-DD"
  category?: string | null
  installment_number?: number | null
  installment_total?: number | null
}

/** Payload de confirmação da fatura importada. */
export type ConfirmInvoicePayload = {
  card_id?: string | null
  due_date: string // "YYYY-MM-DD"
  description: string
  status: 'prevista' | 'realizada'
  /** TOTAL A PAGAR da fatura (difere da soma das compras quando há créditos). Ausente = soma dos itens. */
  amount_cents?: number
  items: ConfirmInvoiceItem[]
}

// ---------------------------------------------------------------------------
// Helpers de dinheiro
// ---------------------------------------------------------------------------

/** Converte centavos (inteiro) para número em reais. */
export function centsToReais(cents: number): number {
  return (cents ?? 0) / 100
}

/** Converte um valor em reais (número ou string "1.234,56") para centavos inteiros. */
export function reaisToCents(value: number | string): number {
  if (typeof value === 'number') {
    return Math.round(value * 100)
  }
  const normalized = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    // remove separador de milhar e usa ponto como decimal
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
  const num = Number(normalized)
  return Number.isFinite(num) ? Math.round(num * 100) : 0
}

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Formata centavos como moeda brasileira (ex.: 123456 -> "R$ 1.234,56"). */
export function formatCents(cents: number): string {
  return BRL.format(centsToReais(cents))
}

// ---------------------------------------------------------------------------
// Fontes de Receita (income-sources)
// ---------------------------------------------------------------------------

export async function listIncomeSources(): Promise<IncomeSource[]> {
  const { data } = await meufinClient.get<Paginated<IncomeSource>>(`${BASE}/income-sources`, {
    params: { limit: 500 },
  })
  return data.items
}

/** Variante paginada para a tela de gestão (selects usam a de cima). */
export async function listIncomeSourcesPaged(params: {
  limit: number
  offset: number
  query?: string
  kind?: string
  active?: boolean
}): Promise<Paginated<IncomeSource>> {
  const { data } = await meufinClient.get<Paginated<IncomeSource>>(`${BASE}/income-sources`, {
    params,
  })
  return data
}

export async function getIncomeSource(id: string): Promise<IncomeSource> {
  const { data } = await meufinClient.get<IncomeSource>(`${BASE}/income-sources/${id}`)
  return data
}

export async function createIncomeSource(input: IncomeSourceInput): Promise<IncomeSource> {
  const { data } = await meufinClient.post<IncomeSource>(`${BASE}/income-sources`, input)
  return data
}

export async function updateIncomeSource(
  id: string,
  input: IncomeSourceInput
): Promise<IncomeSource> {
  const { data } = await meufinClient.put<IncomeSource>(`${BASE}/income-sources/${id}`, input)
  return data
}

export async function deleteIncomeSource(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/income-sources/${id}`)
}

// ---------------------------------------------------------------------------
// Lançamentos (entries)
// ---------------------------------------------------------------------------

export async function listEntries(params: ListEntriesParams = {}): Promise<Paginated<Entry>> {
  const { data } = await meufinClient.get<Paginated<Entry>>(`${BASE}/entries`, { params })
  return data
}

export async function getEntry(id: string): Promise<Entry> {
  const { data } = await meufinClient.get<Entry>(`${BASE}/entries/${id}`)
  return data
}

/**
 * Cria um lançamento. Para recorrentes, o backend gera os previstos até dezembro
 * e retorna { items, total } com todos os lançamentos criados.
 */
export async function createEntry(input: EntryInput): Promise<Paginated<Entry>> {
  const { data } = await meufinClient.post<Paginated<Entry>>(`${BASE}/entries`, input)
  return data
}

/**
 * Com apply_to='future', a API devolve o alcance da edição em série:
 * series_updated (total), series_due_dates_updated (dia do vencimento — série
 * inteira) e series_fields_updated (valor/descrição/categoria — previstas futuras).
 */
export type SeriesUpdateResult = {
  series_updated?: number
  series_due_dates_updated?: number
  series_fields_updated?: number
}

export async function updateEntry(
  id: string,
  input: Partial<EntryInput>,
): Promise<Entry & SeriesUpdateResult> {
  const { data } = await meufinClient.put<Entry & SeriesUpdateResult>(
    `${BASE}/entries/${id}`,
    input,
  )
  return data
}

export async function deleteEntry(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/entries/${id}`)
}

/**
 * Confirmação com desconto e/ou pagamento parcial.
 * paid_amount_cents menor que o devido gera lançamento residual automático
 * (vencendo em residual_due_date ou na data original).
 */
export type ConfirmEntryPayload = {
  discount_cents?: number
  discount_reason?: string
  paid_amount_cents?: number
  residual_due_date?: string // "YYYY-MM-DD"
  /** Data em que o pagamento foi feito ("YYYY-MM-DD"); ausente = agora. */
  paid_at?: string
}

export async function confirmEntry(id: string, payload?: ConfirmEntryPayload): Promise<Entry> {
  const hasBody = Boolean(
    payload?.discount_cents || payload?.paid_amount_cents || payload?.paid_at,
  )
  const { data } = await meufinClient.post<Entry>(
    `${BASE}/entries/${id}/confirm`,
    hasBody ? payload : undefined,
  )
  return data
}

/** Catálogo global de motivos de desconto (fixo, curado no backend). */
export async function listDiscountReasons(): Promise<DiscountReason[]> {
  const { data } = await meufinClient.get<Paginated<DiscountReason>>(`${BASE}/discount-reasons`)
  return data.items
}

/** Desfaz a liquidação: realizada volta a prevista, detalhes de pagamento limpos. */
export async function reopenEntry(id: string): Promise<Entry> {
  const { data } = await meufinClient.post<Entry>(`${BASE}/entries/${id}/reopen`)
  return data
}

/** Menor e maior ano de vencimento do workspace (0 quando não há lançamentos). */
export async function getEntryYearBounds(): Promise<{ min_year: number; max_year: number }> {
  const { data } = await meufinClient.get<{ min_year: number; max_year: number }>(
    `${BASE}/entries/year-bounds`,
  )
  return data
}

/** Corrige o total de um parcelamento (15x → 12x): exclui/cria/atualiza parcelas. */
export async function resizeInstallments(
  id: string,
  newTotal: number,
): Promise<{ new_total: number; removed: number; created: number; updated: number }> {
  const { data } = await meufinClient.post(`${BASE}/entries/${id}/resize-installments`, {
    new_total: newTotal,
  })
  return data
}

export async function cancelEntry(id: string): Promise<Entry> {
  const { data } = await meufinClient.post<Entry>(`${BASE}/entries/${id}/cancel`)
  return data
}

// ---------------------------------------------------------------------------
// Cartões de Crédito (cards)
// ---------------------------------------------------------------------------

/** Parcelamento ativo identificado nas faturas (projeção calculada). */
export type InstallmentGroup = {
  description: string
  /** 'invoice' = compra em fatura (projeção); 'expense' = despesa parcelada (parcelas reais). */
  source: 'invoice' | 'expense'
  card_id?: string | null
  category?: string | null
  installment_cents: number
  installment_total: number
  last_known_number: number
  remaining_count: number
  remaining_cents: number
  last_due_date: string // YYYY-MM-DD
  ends_at: string // YYYY-MM
}

export type MonthlyCommitment = {
  month: string // YYYY-MM
  total_cents: number
  count: number
}

export type InstallmentsProjection = {
  groups: InstallmentGroup[]
  monthly: MonthlyCommitment[]
  remaining_total_cents: number
}

/** Projeção de compromissos parcelados dentro de faturas (não são lançamentos). */
export async function getInstallmentsProjection(): Promise<InstallmentsProjection> {
  const { data } = await meufinClient.get<InstallmentsProjection>(`${BASE}/installments`)
  return data
}

/** Catálogo global de bandeiras (fixo, curado no backend). */
export async function listCardBrands(): Promise<CardBrand[]> {
  const { data } = await meufinClient.get<Paginated<CardBrand>>(`${BASE}/card-brands`)
  return data.items
}

export async function listCards(): Promise<CreditCard[]> {
  const { data } = await meufinClient.get<Paginated<CreditCard>>(`${BASE}/cards`, {
    params: { limit: 500 },
  })
  return data.items
}

/** Variante paginada para a tela de gestão. */
export async function listCardsPaged(params: {
  limit: number
  offset: number
  query?: string
  active?: boolean
}): Promise<Paginated<CreditCard>> {
  const { data } = await meufinClient.get<Paginated<CreditCard>>(`${BASE}/cards`, { params })
  return data
}

export async function getCard(id: string): Promise<CreditCard> {
  const { data } = await meufinClient.get<CreditCard>(`${BASE}/cards/${id}`)
  return data
}

export async function createCard(input: CreditCardInput): Promise<CreditCard> {
  const { data } = await meufinClient.post<CreditCard>(`${BASE}/cards`, input)
  return data
}

export async function updateCard(id: string, input: CreditCardInput): Promise<CreditCard> {
  const { data } = await meufinClient.put<CreditCard>(`${BASE}/cards/${id}`, input)
  return data
}

export async function deleteCard(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/cards/${id}`)
}

// ---------------------------------------------------------------------------
// Membros da família (para atribuir receitas)
// ---------------------------------------------------------------------------

/**
 * Lê `data.items` diretamente do endpoint de saúde. Não reutilizamos o client de
 * health de propósito (ele pode ter bug de shape); aqui garantimos { items, total }.
 */
export async function listFamilyMembers(): Promise<FamilyMemberLite[]> {
  const { data } = await meufinClient.get<Paginated<FamilyMemberLite>>(
    `${HEALTH_BASE}/family-members`
  )
  return data.items ?? []
}

// ---------------------------------------------------------------------------
// Importação de fatura por PDF + LLM (documents)
// ---------------------------------------------------------------------------

/**
 * Envia o arquivo (PDF/imagem) da fatura. Multipart: `file` + `card_id?`.
 * Retorna o documento criado (com id).
 */
/** Lista documentos fiscais (cupons/notas) importados. */
export async function listFiscalDocuments(params: {
  limit: number
  offset: number
  /** Busca pelo nome original do arquivo. */
  q?: string
  /** Status de extração (pending | processing | extracted | failed | not_required). */
  status?: string
  /** Vínculo com despesa: true = vinculados, false = sem vínculo. */
  linked?: boolean
}): Promise<Paginated<FinanceDocument>> {
  const { data } = await meufinClient.get<Paginated<FinanceDocument>>(`${BASE}/documents`, {
    params: { ...params, kind: 'fiscal' },
  })
  return data
}

/** Confirma o cupom/nota fiscal: grava itens e vincula à despesa. */
export async function confirmFiscal(
  documentId: string,
  payload: ConfirmFiscalPayload,
): Promise<{
  entry: Entry
  items: FiscalItem[]
  items_total: number
  created_categories: CreatedCategory[]
}> {
  const { data } = await meufinClient.post(`${BASE}/documents/${documentId}/fiscal-confirm`, payload)
  return data
}

/** Detalhamento fiscal (itens de cupom/nota) de um lançamento. */
export async function listFiscalItems(entryId: string): Promise<FiscalItem[]> {
  const { data } = await meufinClient.get<Paginated<FiscalItem>>(
    `${BASE}/entries/${entryId}/fiscal-items`,
  )
  return data.items
}

/** Uso de consultas fiscais verificadas da tenant no mês corrente. */
export type FiscalVerificationUsage = {
  tier: string
  limit: number
  used: number
  remaining: number
  period: string // AAAA-MM
}

export type Entitlements = { fiscal_verification: FiscalVerificationUsage }

/** Plano/cota do workspace (contador de consultas verificadas do mês). */
export async function getEntitlements(): Promise<Entitlements> {
  const { data } = await meufinClient.get<Entitlements>(`${BASE}/entitlements`)
  return data
}

export async function uploadInvoiceDocument(
  file: File,
  cardId?: string,
  kind: 'import' | 'fiscal' = 'import'
): Promise<FinanceDocument> {
  const form = new FormData()
  form.append('file', file)
  form.append('kind', kind)
  if (cardId) form.append('card_id', cardId)
  const { data } = await meufinClient.post<FinanceDocument>(`${BASE}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Dispara a extração assíncrona do documento (202 Accepted).
 * - pdfPassword: senha do PDF protegido (usada só em memória no backend).
 * - chave: em cupom fiscal, a chave de acesso de 44 dígitos ou a URL do QR
 *   Code. Presente → tenta a consulta SEFAZ (verificada) antes do fallback IA.
 */
export async function triggerExtraction(
  documentId: string,
  pdfPassword?: string,
  chave?: string,
): Promise<void> {
  const body: Record<string, string> = {}
  if (pdfPassword) body.pdf_password = pdfPassword
  if (chave) body.chave = chave
  await meufinClient.post(
    `${BASE}/documents/${documentId}/extract`,
    Object.keys(body).length ? body : undefined,
  )
}

/** Consulta o status/resultado da extração (polling). */
export async function getExtractionStatus(documentId: string): Promise<ExtractionStatus> {
  const { data } = await meufinClient.get<ExtractionStatus>(
    `${BASE}/documents/${documentId}/extraction-status`
  )
  return data
}

/** Confirma a fatura importada, criando a fatura + compras (valores em centavos inteiros). */
export async function confirmInvoice(
  documentId: string,
  payload: ConfirmInvoicePayload
): Promise<Entry> {
  const { data } = await meufinClient.post<Entry>(
    `${BASE}/documents/${documentId}/confirm`,
    payload
  )
  return data
}

// ---------------------------------------------------------------------------
// Contas (finance_accounts) — usadas na liquidação
// ---------------------------------------------------------------------------

export type AccountKind = 'corrente' | 'poupanca' | 'carteira' | 'digital'

export type FinanceAccount = {
  id: string
  name: string
  kind: AccountKind
  bank_name?: string | null
  active: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type FinanceAccountInput = {
  name: string
  kind: AccountKind
  bank_name?: string | null
  active: boolean
  notes?: string | null
}

export async function listAccounts(): Promise<FinanceAccount[]> {
  const { data } = await meufinClient.get<Paginated<FinanceAccount>>(`${BASE}/accounts`, {
    params: { limit: 500 },
  })
  return data.items
}

/** Variante paginada para a tela de gestão. */
export async function listAccountsPaged(params: {
  limit: number
  offset: number
  query?: string
  kind?: string
  active?: boolean
}): Promise<Paginated<FinanceAccount>> {
  const { data } = await meufinClient.get<Paginated<FinanceAccount>>(`${BASE}/accounts`, {
    params,
  })
  return data
}

export async function createAccount(input: FinanceAccountInput): Promise<FinanceAccount> {
  const { data } = await meufinClient.post<FinanceAccount>(`${BASE}/accounts`, input)
  return data
}

export async function updateAccount(id: string, input: FinanceAccountInput): Promise<FinanceAccount> {
  const { data } = await meufinClient.put<FinanceAccount>(`${BASE}/accounts/${id}`, input)
  return data
}

export async function deleteAccount(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/accounts/${id}`)
}

// ---------------------------------------------------------------------------
// Liquidação (settle) + comprovantes (receipts)
// ---------------------------------------------------------------------------

export type PaymentMethod =
  | 'pix'
  | 'debito'
  | 'transferencia'
  | 'boleto'
  | 'dinheiro'
  | 'cartao_credito'

export type SettleEntryInput = {
  paid_at?: string | null // "YYYY-MM-DD" ou RFC3339; default: agora
  paid_amount_cents?: number | null // default: amount_cents
  payment_method: PaymentMethod
  account_id?: string | null
  card_id?: string | null
  notes?: string | null
}

/** Liquida o lançamento (pagamento/recebimento). Fatura pai cascateia para os filhos. */
export async function settleEntry(id: string, input: SettleEntryInput): Promise<Entry> {
  const { data } = await meufinClient.post<Entry>(`${BASE}/entries/${id}/settle`, input)
  return data
}

export type EntryReceipt = {
  id: string
  entry_id?: string | null
  file_name: string
  original_file_name: string
  mime_type: string
  size_bytes: number
  created_at?: string
}

export async function listEntryReceipts(entryId: string): Promise<EntryReceipt[]> {
  const { data } = await meufinClient.get<Paginated<EntryReceipt>>(
    `${BASE}/entries/${entryId}/receipts`
  )
  return data.items ?? []
}

export async function uploadEntryReceipt(entryId: string, file: File): Promise<EntryReceipt> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await meufinClient.post<EntryReceipt>(
    `${BASE}/entries/${entryId}/receipts`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function entryReceiptDownloadURL(entryId: string, receiptId: string): Promise<string> {
  const { data } = await meufinClient.get<{ url: string }>(
    `${BASE}/entries/${entryId}/receipts/${receiptId}/download-url`
  )
  return data.url
}

export async function deleteEntryReceipt(entryId: string, receiptId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/entries/${entryId}/receipts/${receiptId}`)
}

// ---------------------------------------------------------------------------
// Dashboard financeira (agregados; valores em CENTAVOS)
// ---------------------------------------------------------------------------

export type DashboardSummary = {
  year: number
  month: number
  income_realized_cents: number
  income_expected_cents: number
  expense_realized_cents: number
  expense_expected_cents: number
  balance_realized_cents: number
  balance_expected_cents: number
  receivable_cents: number
  payable_cents: number
  categories: { category: string; total_cents: number }[]
  future_installments: {
    total_cents: number
    count: number
    last_due_date?: string | null
  }
}

export type DashboardMonth = {
  month: number
  income_realized_cents: number
  income_expected_cents: number
  expense_realized_cents: number
  expense_expected_cents: number
  balance_expected_cents: number
}

export async function getFinanceDashboard(params: {
  year?: number
  month?: number
  family_member_id?: string
}): Promise<DashboardSummary> {
  const { data } = await meufinClient.get<DashboardSummary>(`${BASE}/dashboard`, { params })
  return data
}

export async function getFinanceDashboardMonthly(params: {
  year?: number
  family_member_id?: string
}): Promise<{ year: number; months: DashboardMonth[] }> {
  const { data } = await meufinClient.get<{ year: number; months: DashboardMonth[] }>(
    `${BASE}/dashboard/monthly`,
    { params }
  )
  return data
}


// ---------------------------------------------------------------------------
// Categorias de despesa (gerenciadas por workspace; grupo canônico curado)
// ---------------------------------------------------------------------------

export type ExpenseGroup = { slug: string; name: string; description?: string }

export type ExpenseCategory = {
  id: string
  slug: string
  name: string
  group_slug: string
  group_name: string
  active: boolean
}

export type ExpenseCategoriesResponse = {
  items: ExpenseCategory[]
  total: number
  groups: ExpenseGroup[]
}

/**
 * Lista categorias do workspace (o backend semeia as padrão no 1º uso) + grupos
 * curados. Sem params retorna tudo (selects); com limit/offset pagina (gestão).
 */
export async function listExpenseCategories(params?: {
  limit: number
  offset: number
  query?: string
  group?: string
  active?: boolean
}): Promise<ExpenseCategoriesResponse> {
  const { data } = await meufinClient.get<ExpenseCategoriesResponse>(
    `${BASE}/expense-categories`,
    { params }
  )
  return data
}

export async function createExpenseCategory(input: {
  name: string
  group_slug: string
}): Promise<ExpenseCategory> {
  const { data } = await meufinClient.post<ExpenseCategory>(`${BASE}/expense-categories`, input)
  return data
}

export async function updateExpenseCategory(
  id: string,
  input: { name: string; group_slug: string; active?: boolean }
): Promise<ExpenseCategory> {
  const { data } = await meufinClient.put<ExpenseCategory>(
    `${BASE}/expense-categories/${id}`,
    input
  )
  return data
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/expense-categories/${id}`)
}

// ---------------------------------------------------------------------------
// Fornecedores (suppliers)
// ---------------------------------------------------------------------------

export type SupplierCategory =
  | 'servicos_publicos'
  | 'telecom'
  | 'streaming'
  | 'varejo'
  | 'farmacia'
  | 'saude'
  | 'seguros'
  | 'financeiro'
  | 'educacao'
  | 'alimentacao'
  | 'transporte'
  | 'academia'
  | 'moradia'
  | 'tecnologia'
  | 'pet'
  | 'juridico'
  | 'contabil'
  | 'condominio'
  | 'vestuario'
  | 'beleza'
  | 'viagem'
  | 'entretenimento'
  | 'outros'

export type SupplierBillingType =
  | 'boleto'
  | 'pix'
  | 'cartao_credito'
  | 'debito_automatico'
  | 'debito'
  | 'transferencia'
  | 'desconto_folha'

export type Supplier = {
  id: string
  workspace_id?: string | null
  is_global: boolean
  name: string
  category: SupplierCategory
  default_billing_type?: SupplierBillingType | null
  pix_key?: string | null
  pix_key_holder?: string | null
  bank_name?: string | null
  bank_agency?: string | null
  bank_account?: string | null
  bank_account_type?: string | null
  notes?: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export type SupplierInput = {
  name: string
  category: SupplierCategory
  default_billing_type?: SupplierBillingType | null
  pix_key?: string | null
  pix_key_holder?: string | null
  bank_name?: string | null
  bank_agency?: string | null
  bank_account?: string | null
  bank_account_type?: string | null
  notes?: string | null
  active: boolean
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data } = await meufinClient.get<Paginated<Supplier>>(`${BASE}/suppliers`, {
    params: { limit: 500 },
  })
  return data.items
}

export async function listSuppliersPaged(params: {
  limit: number
  offset: number
  query?: string
  category?: string
  active?: boolean
}): Promise<Paginated<Supplier>> {
  const { data } = await meufinClient.get<Paginated<Supplier>>(`${BASE}/suppliers`, { params })
  return data
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const { data } = await meufinClient.post<Supplier>(`${BASE}/suppliers`, input)
  return data
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<Supplier> {
  const { data } = await meufinClient.put<Supplier>(`${BASE}/suppliers/${id}`, input)
  return data
}

export async function deleteSupplier(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/suppliers/${id}`)
}

// ---------------------------------------------------------------------------
// Dashboard Fiscal (cupons/notas — histórico de preço e inflação por item)
// ---------------------------------------------------------------------------

/** Produto agregado por (nome normalizado, unidade de medida). */
export type FiscalProduct = {
  name: string
  /** Unidade de medida (KG, UN, L…); '' quando desconhecida. */
  unit: string
  purchases: number
  qty_milli_total: number
  total_cents: number
  avg_unit_cents: number
  min_unit_cents: number
  max_unit_cents: number
  first_unit_cents: number
  last_unit_cents: number
  first_date?: string | null
  last_date?: string | null
  /** Variação % primeiro→último preço unitário. */
  variation_pct: number
}

export type FiscalMonthSpend = {
  month: string // YYYY-MM
  total_cents: number
  items: number
}

export type FiscalDashboardSummary = {
  documents: number
  items: number
  total_cents: number
  products_count: number
  top_by_frequency: FiscalProduct[]
  top_by_spend: FiscalProduct[]
  monthly_spend: FiscalMonthSpend[]
}

export type FiscalPurchase = {
  purchase_date: string // YYYY-MM-DD
  unit_cents: number
  quantity_milli: number
  amount_cents: number
  unit: string
  document_id: string
  document_name: string
}

export type FiscalInflationPoint = {
  month: string // YYYY-MM
  index: number // base 100 no mês mais antigo
  monthly_pct: number
  matched_products: number
}

export type FiscalInflation = {
  points: FiscalInflationPoint[]
  variation_12m: number
  methodology: string
}

export type FiscalProductSort = 'frequency' | 'spend' | 'inflation'

export async function getFiscalDashboard(): Promise<FiscalDashboardSummary> {
  const { data } = await meufinClient.get<FiscalDashboardSummary>(`${BASE}/fiscal/dashboard`)
  return data
}

export async function listFiscalProducts(params: {
  q?: string
  sort?: FiscalProductSort
  limit?: number
}): Promise<{ products: FiscalProduct[]; total: number }> {
  const { data } = await meufinClient.get<{ products: FiscalProduct[]; total: number }>(
    `${BASE}/fiscal/products`,
    { params }
  )
  return data
}

export async function getFiscalPriceHistory(
  name: string,
  unit = ''
): Promise<{ name: string; unit: string; purchases: FiscalPurchase[]; total: number }> {
  const { data } = await meufinClient.get<{
    name: string
    unit: string
    purchases: FiscalPurchase[]
    total: number
  }>(`${BASE}/fiscal/products/price-history`, { params: { name, unit } })
  return data
}

export async function getFiscalInflation(): Promise<FiscalInflation> {
  const { data } = await meufinClient.get<FiscalInflation>(`${BASE}/fiscal/inflation`)
  return data
}
