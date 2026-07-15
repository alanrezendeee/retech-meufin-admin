import { meufinClient } from '@/lib/api/meufin-client'

const BASE = '/api/v1/home-safety'

export type HomeSafetyCategory =
  | 'gas'
  | 'agua'
  | 'incendio'
  | 'eletrica'
  | 'climatizacao'
  | 'pragas'
  | 'estrutura'
  | 'seguranca_eletronica'
  | 'piscina'
  | 'saude'
  | 'outros'

export type HomeSafetyRiskType = 'fisico' | 'quimico' | 'biologico' | 'eletrico' | 'incendio' | 'outros'

export type HomeSafetyPriority = 'alta' | 'media' | 'baixa'

export type HomeSafetyStatus = 'vencido' | 'atencao' | 'proximo' | 'ok' | 'sem_controle'

export type HomeSafetyEventType =
  | 'instalacao'
  | 'troca'
  | 'manutencao'
  | 'inspecao'
  | 'recarga'
  | 'limpeza'

export type HomeSafetyItem = {
  id: string
  name: string
  category: HomeSafetyCategory
  risk_type: HomeSafetyRiskType
  location?: string | null
  brand?: string | null
  model?: string | null
  installed_at?: string | null
  lifespan_months?: number | null
  service_interval_months?: number | null
  last_service_at?: string | null
  next_due_date?: string | null
  priority: HomeSafetyPriority
  responsible?: string | null
  last_cost_cents: number
  active: boolean
  notes?: string | null
  status: HomeSafetyStatus
  days_until_due?: number | null
  created_at: string
  updated_at: string
}

export type HomeSafetyItemInput = {
  name: string
  category: HomeSafetyCategory
  risk_type: HomeSafetyRiskType
  location?: string | null
  brand?: string | null
  model?: string | null
  installed_at?: string | null
  lifespan_months?: number | null
  service_interval_months?: number | null
  last_service_at?: string | null
  priority: HomeSafetyPriority
  responsible?: string | null
  last_cost_cents?: number
  active?: boolean
  notes?: string | null
}

export type HomeSafetyEvent = {
  id: string
  item_id: string
  event_type: HomeSafetyEventType
  event_date: string
  cost_cents: number
  provider?: string | null
  notes?: string | null
  created_at: string
}

export type HomeSafetyEventInput = {
  event_type: HomeSafetyEventType
  event_date: string
  cost_cents?: number
  provider?: string | null
  notes?: string | null
}

export type HomeSafetyCatalogEntry = {
  key: string
  name: string
  category: HomeSafetyCategory
  risk_type: HomeSafetyRiskType
  lifespan_months?: number | null
  service_interval_months?: number | null
  priority: HomeSafetyPriority
  default_location: string
  notes: string
}

export type HomeSafetyDashboard = {
  total_items: number
  annual_cost_cents: number
  status_counts: { status: HomeSafetyStatus; count: number }[]
  by_category: { category: HomeSafetyCategory; count: number }[]
  by_risk: { risk_type: HomeSafetyRiskType; count: number }[]
  cost_by_year: { year: number; cost_cents: number }[]
  cost_by_category: { category: HomeSafetyCategory; cost_cents: number }[]
  overdue: HomeSafetyItem[]
  due_next_30: HomeSafetyItem[]
  due_next_90: HomeSafetyItem[]
}

// ─── Items ────────────────────────────────────────────────────────────────────

export async function listHomeSafetyItems(params?: {
  category?: string
  status?: string
  location?: string
  q?: string
}): Promise<HomeSafetyItem[]> {
  const { data } = await meufinClient.get<{ items: HomeSafetyItem[] }>(`${BASE}/items`, { params })
  return data.items
}

export async function getHomeSafetyItem(id: string): Promise<HomeSafetyItem> {
  const { data } = await meufinClient.get<HomeSafetyItem>(`${BASE}/items/${id}`)
  return data
}

export async function createHomeSafetyItem(input: HomeSafetyItemInput): Promise<HomeSafetyItem> {
  const { data } = await meufinClient.post<HomeSafetyItem>(`${BASE}/items`, input)
  return data
}

export async function updateHomeSafetyItem(id: string, input: HomeSafetyItemInput): Promise<HomeSafetyItem> {
  const { data } = await meufinClient.put<HomeSafetyItem>(`${BASE}/items/${id}`, input)
  return data
}

export async function deleteHomeSafetyItem(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/items/${id}`)
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function listHomeSafetyEvents(itemId: string): Promise<HomeSafetyEvent[]> {
  const { data } = await meufinClient.get<{ items: HomeSafetyEvent[] }>(`${BASE}/items/${itemId}/events`)
  return data.items
}

export async function createHomeSafetyEvent(
  itemId: string,
  input: HomeSafetyEventInput,
): Promise<{ event: HomeSafetyEvent; item: HomeSafetyItem }> {
  const { data } = await meufinClient.post<{ event: HomeSafetyEvent; item: HomeSafetyItem }>(
    `${BASE}/items/${itemId}/events`,
    input,
  )
  return data
}

export async function deleteHomeSafetyEvent(itemId: string, eventId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/items/${itemId}/events/${eventId}`)
}

// ─── Dashboard & catalog ──────────────────────────────────────────────────────

export async function getHomeSafetyDashboard(): Promise<HomeSafetyDashboard> {
  const { data } = await meufinClient.get<HomeSafetyDashboard>(`${BASE}/dashboard`)
  return data
}

export async function getHomeSafetyCatalog(): Promise<HomeSafetyCatalogEntry[]> {
  const { data } = await meufinClient.get<{ items: HomeSafetyCatalogEntry[] }>(`${BASE}/catalog`)
  return data.items
}
