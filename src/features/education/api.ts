import { meufinClient } from '@/lib/api/meufin-client'

const BASE = '/api/v1/education'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type Stage =
  | 'bercario'
  | 'infantil'
  | 'fundamental1'
  | 'fundamental2'
  | 'medio'
  | 'tecnico'
  | 'pre_vestibular'
  | 'superior'
  | 'pos'

export type Shift = 'manha' | 'tarde' | 'integral' | 'noite' | 'ead'

export type ListStatus = 'planejada' | 'em_compra' | 'concluida'

export type ItemCategory =
  | 'papelaria'
  | 'livros'
  | 'uniforme'
  | 'mochila'
  | 'eletronicos'
  | 'arte'
  | 'higiene'
  | 'outros'

export type Enrollment = {
  id: string
  member_id: string
  member_name?: string | null
  school_year: number
  stage: Stage
  school_name?: string | null
  grade?: string | null
  shift?: Shift | null
  monthly_fee_cents: number
  enrollment_fee_cents: number
  notes?: string | null
  created_at: string
  updated_at: string
}

export type EnrollmentInput = {
  member_id: string
  school_year: number
  stage: Stage
  school_name?: string | null
  grade?: string | null
  shift?: Shift | null
  monthly_fee_cents: number
  enrollment_fee_cents: number
  notes?: string | null
}

export type SupplyItem = {
  id: string
  list_id: string
  name: string
  category: ItemCategory
  quantity: number
  reference_price_cents: number
  purchased: boolean
  paid_price_cents: number
  purchased_at?: string | null
  store?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export type SupplyItemInput = {
  name: string
  category?: ItemCategory
  quantity?: number
  reference_price_cents?: number
  purchased?: boolean
  paid_price_cents?: number
  purchased_at?: string | null
  store?: string | null
  notes?: string | null
}

export type PurchaseInput = {
  paid_price_cents: number
  purchased_at?: string | null
  store?: string | null
}

export type SupplyList = {
  id: string
  enrollment_id: string
  member_id?: string | null
  member_name?: string | null
  school_year?: number | null
  title: string
  status: ListStatus
  notes?: string | null
  items: SupplyItem[]
  created_at: string
  updated_at: string
}

export type SupplyListInput = {
  enrollment_id: string
  title: string
  status?: ListStatus
  notes?: string | null
}

export type SupplyListUpdateInput = {
  title: string
  status?: ListStatus
  notes?: string | null
}

export type MemberSpend = {
  member_id: string
  member_name: string
  total_paid_cents: number
  item_count: number
  purchased_count: number
  purchased_pct: number
}

export type CategoryAvg = {
  category: string
  item_count: number
  purchased_count: number
  total_paid_cents: number
  avg_paid_cents: number
}

export type YearSpend = {
  school_year: number
  monthly_fees_cents: number
  enrollment_fees_cents: number
  supplies_paid_cents: number
  total_cents: number
}

export type EducationDashboard = {
  school_year: number
  total_reference_cents: number
  total_paid_cents: number
  list_count: number
  item_count: number
  purchased_count: number
  purchased_pct: number
  savings_cents: number
  savings_pct: number
  monthly_fees_cents: number
  enrollment_fees_cents: number
  by_member: MemberSpend[]
  by_category: CategoryAvg[]
  annual_evolution: YearSpend[]
}

type Wrapped<T> = { items: T[] }

// ─── Enrollments ────────────────────────────────────────────────────────────────

export async function listEnrollments(params?: {
  member_id?: string
  school_year?: number
}): Promise<Enrollment[]> {
  const { data } = await meufinClient.get<Wrapped<Enrollment>>(`${BASE}/enrollments`, { params })
  return data.items
}

export async function getEnrollment(id: string): Promise<Enrollment> {
  const { data } = await meufinClient.get<Enrollment>(`${BASE}/enrollments/${id}`)
  return data
}

export async function createEnrollment(input: EnrollmentInput): Promise<Enrollment> {
  const { data } = await meufinClient.post<Enrollment>(`${BASE}/enrollments`, input)
  return data
}

export async function updateEnrollment(id: string, input: EnrollmentInput): Promise<Enrollment> {
  const { data } = await meufinClient.put<Enrollment>(`${BASE}/enrollments/${id}`, input)
  return data
}

export async function deleteEnrollment(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/enrollments/${id}`)
}

// ─── Supply lists ─────────────────────────────────────────────────────────────

export async function listSupplyLists(params?: {
  enrollment_id?: string
  school_year?: number
  status?: string
}): Promise<SupplyList[]> {
  const { data } = await meufinClient.get<Wrapped<SupplyList>>(`${BASE}/supply-lists`, { params })
  return data.items
}

export async function getSupplyList(id: string): Promise<SupplyList> {
  const { data } = await meufinClient.get<SupplyList>(`${BASE}/supply-lists/${id}`)
  return data
}

export async function createSupplyList(input: SupplyListInput): Promise<SupplyList> {
  const { data } = await meufinClient.post<SupplyList>(`${BASE}/supply-lists`, input)
  return data
}

export async function updateSupplyList(id: string, input: SupplyListUpdateInput): Promise<SupplyList> {
  const { data } = await meufinClient.put<SupplyList>(`${BASE}/supply-lists/${id}`, input)
  return data
}

export async function deleteSupplyList(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/supply-lists/${id}`)
}

// ─── Supply items ─────────────────────────────────────────────────────────────

export async function addSupplyItem(listId: string, input: SupplyItemInput): Promise<SupplyItem> {
  const { data } = await meufinClient.post<SupplyItem>(`${BASE}/supply-lists/${listId}/items`, input)
  return data
}

export async function updateSupplyItem(
  listId: string,
  itemId: string,
  input: SupplyItemInput,
): Promise<SupplyItem> {
  const { data } = await meufinClient.put<SupplyItem>(
    `${BASE}/supply-lists/${listId}/items/${itemId}`,
    input,
  )
  return data
}

export async function deleteSupplyItem(listId: string, itemId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/supply-lists/${listId}/items/${itemId}`)
}

export async function purchaseSupplyItem(
  listId: string,
  itemId: string,
  input: PurchaseInput,
): Promise<SupplyItem> {
  const { data } = await meufinClient.post<SupplyItem>(
    `${BASE}/supply-lists/${listId}/items/${itemId}/purchase`,
    input,
  )
  return data
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export async function getEducationDashboard(schoolYear?: number): Promise<EducationDashboard> {
  const { data } = await meufinClient.get<EducationDashboard>(`${BASE}/dashboard`, {
    params: schoolYear ? { school_year: schoolYear } : undefined,
  })
  return data
}
