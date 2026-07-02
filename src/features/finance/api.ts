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
  brand?: string | null
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
  closing_day?: number | null
  due_day?: number | null
  active: boolean
  notes?: string | null
}

export type EntryKind = 'credit' | 'debit'
export type EntryStatus = 'prevista' | 'realizada' | 'cancelada'
export type IncomeType =
  | 'salario'
  | 'pro_labore'
  | 'dividendos'
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
  created_at?: string
  updated_at?: string
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
}

export type ListEntriesParams = {
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

/** Retorno do endpoint de status de extração. */
export type ExtractionStatus = {
  status: ExtractionStatusValue
  provider?: string | null
  error_message?: string | null
  started_at?: string | null
  finished_at?: string | null
  purchases?: PurchaseSuggestion[]
}

/** Item da fatura no confirm — `amount` em REAIS (o backend converte para centavos). */
export type ConfirmInvoiceItem = {
  description: string
  amount: number // REAIS
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
  const { data } = await meufinClient.get<Paginated<IncomeSource>>(`${BASE}/income-sources`)
  return data.items
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

export async function updateEntry(id: string, input: Partial<EntryInput>): Promise<Entry> {
  const { data } = await meufinClient.put<Entry>(`${BASE}/entries/${id}`, input)
  return data
}

export async function deleteEntry(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/entries/${id}`)
}

export async function confirmEntry(id: string): Promise<Entry> {
  const { data } = await meufinClient.post<Entry>(`${BASE}/entries/${id}/confirm`)
  return data
}

export async function cancelEntry(id: string): Promise<Entry> {
  const { data } = await meufinClient.post<Entry>(`${BASE}/entries/${id}/cancel`)
  return data
}

// ---------------------------------------------------------------------------
// Cartões de Crédito (cards)
// ---------------------------------------------------------------------------

export async function listCards(): Promise<CreditCard[]> {
  const { data } = await meufinClient.get<Paginated<CreditCard>>(`${BASE}/cards`)
  return data.items
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
export async function uploadInvoiceDocument(
  file: File,
  cardId?: string
): Promise<FinanceDocument> {
  const form = new FormData()
  form.append('file', file)
  if (cardId) form.append('card_id', cardId)
  const { data } = await meufinClient.post<FinanceDocument>(`${BASE}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** Dispara a extração assíncrona do documento (202 Accepted). */
export async function triggerExtraction(documentId: string): Promise<void> {
  await meufinClient.post(`${BASE}/documents/${documentId}/extract`)
}

/** Consulta o status/resultado da extração (polling). */
export async function getExtractionStatus(documentId: string): Promise<ExtractionStatus> {
  const { data } = await meufinClient.get<ExtractionStatus>(
    `${BASE}/documents/${documentId}/extraction-status`
  )
  return data
}

/**
 * Confirma a fatura importada, criando a fatura + compras.
 * ATENÇÃO: `items[].amount` deve estar em REAIS (o backend converte para centavos).
 */
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
  const { data } = await meufinClient.get<Paginated<FinanceAccount>>(`${BASE}/accounts`)
  return data.items
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
