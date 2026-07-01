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
  limit?: number
  offset?: number
}

/** Membro da família (subset usado para atribuição de receitas). */
export type FamilyMemberLite = {
  id: string
  full_name: string
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
