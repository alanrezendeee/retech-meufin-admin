import { meufinClient } from '@/lib/api/meufin-client'

const BASE = '/api/v1/warranties'

export type WarrantyCategory =
  | 'eletrodomestico'
  | 'eletronico'
  | 'informatica'
  | 'celular'
  | 'movel'
  | 'veiculo'
  | 'imovel'
  | 'ferramenta'
  | 'brinquedo'
  | 'esporte'
  | 'outros'

export type WarrantyStatus = 'vigente' | 'expira_em_breve' | 'expirada'

export type WarrantyDocType =
  | 'nota_fiscal'
  | 'certificado'
  | 'garantia_estendida'
  | 'manual'
  | 'outros'

export type Warranty = {
  id: string
  item_name: string
  category: WarrantyCategory
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  store?: string | null
  supplier_name?: string | null
  purchase_date: string
  price_cents?: number | null
  invoice_number?: string | null
  entry_id?: string | null
  fiscal_item_id?: string | null
  legal_warranty_days: number
  contractual_warranty_months: number
  extended_warranty_months: number
  extended_provider?: string | null
  extended_cost_cents: number
  coverage_notes?: string | null
  notes?: string | null
  active: boolean
  // calculados no backend
  expires_at: string
  status: WarrantyStatus
  days_remaining: number
  created_at: string
  updated_at: string
}

export type WarrantyInput = {
  item_name: string
  category: WarrantyCategory
  brand?: string | null
  model?: string | null
  serial_number?: string | null
  store?: string | null
  supplier_name?: string | null
  purchase_date: string
  price_cents?: number | null
  invoice_number?: string | null
  entry_id?: string | null
  fiscal_item_id?: string | null
  legal_warranty_days?: number | null
  contractual_warranty_months?: number | null
  extended_warranty_months?: number | null
  extended_provider?: string | null
  extended_cost_cents?: number | null
  coverage_notes?: string | null
  notes?: string | null
  active?: boolean
}

export type WarrantyDocument = {
  id: string
  warranty_id: string
  doc_type: WarrantyDocType
  file_name: string
  original_file_name: string
  content_type: string
  size_bytes: number
  notes?: string | null
  created_at: string
}

export type WarrantyDocumentInput = {
  doc_type: WarrantyDocType
  notes?: string | null
  file: File
}

export type WarrantySummaryExpiringItem = {
  id: string
  item_name: string
  category: WarrantyCategory
  expires_at: string
  days_remaining: number
}

export type WarrantySummaryCategoryCount = {
  category: WarrantyCategory
  count: number
}

export type WarrantySummary = {
  total_active: number
  total_covered_cents: number
  expiring_in_30_count: number
  expiring_in_60_count: number
  expiring_in_90_count: number
  expired_this_year: number
  expiring_soon: WarrantySummaryExpiringItem[]
  by_category: WarrantySummaryCategoryCount[]
}

export type Paginated<T> = { items: T[]; total: number }

// ─── Warranties ─────────────────────────────────────────────────────────────

export async function listWarranties(params: {
  limit: number
  offset: number
  category?: string
  status?: string
  q?: string
}): Promise<Paginated<Warranty>> {
  const { data } = await meufinClient.get<Paginated<Warranty>>(BASE, { params })
  return data
}

export async function getWarranty(id: string): Promise<Warranty> {
  const { data } = await meufinClient.get<Warranty>(`${BASE}/${id}`)
  return data
}

export async function createWarranty(input: WarrantyInput): Promise<Warranty> {
  const { data } = await meufinClient.post<Warranty>(BASE, input)
  return data
}

export async function updateWarranty(id: string, input: WarrantyInput): Promise<Warranty> {
  const { data } = await meufinClient.put<Warranty>(`${BASE}/${id}`, input)
  return data
}

export async function deleteWarranty(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/${id}`)
}

export async function getWarrantySummary(): Promise<WarrantySummary> {
  const { data } = await meufinClient.get<WarrantySummary>(`${BASE}/summary`)
  return data
}

// ─── Documents ──────────────────────────────────────────────────────────────

export async function listWarrantyDocuments(warrantyId: string): Promise<WarrantyDocument[]> {
  const { data } = await meufinClient.get<{ items: WarrantyDocument[] }>(
    `${BASE}/${warrantyId}/documents`,
  )
  return data.items
}

export async function uploadWarrantyDocument(
  warrantyId: string,
  input: WarrantyDocumentInput,
): Promise<WarrantyDocument> {
  const form = new FormData()
  form.append('file', input.file)
  form.append('doc_type', input.doc_type)
  if (input.notes) form.append('notes', input.notes)
  const { data } = await meufinClient.post<WarrantyDocument>(
    `${BASE}/${warrantyId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function warrantyDocumentDownloadURL(
  warrantyId: string,
  docId: string,
): Promise<string> {
  const { data } = await meufinClient.get<{ url: string }>(
    `${BASE}/${warrantyId}/documents/${docId}/download-url`,
  )
  return data.url
}

export async function deleteWarrantyDocument(warrantyId: string, docId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/${warrantyId}/documents/${docId}`)
}
