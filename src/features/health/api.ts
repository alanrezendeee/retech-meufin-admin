import { meufinClient } from '@/lib/api/meufin-client'

/**
 * API do módulo Saúde Familiar (retech-meufin-api).
 * Todos os endpoints sob VITE_API_BASE_URL + /api/v1/health.
 * O Bearer já é injetado pelo meufinClient; o workspace vem do token (sem header).
 */
const BASE = '/api/v1/health'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type Relationship = 'self' | 'spouse' | 'child' | 'parent' | 'other'

export type FamilyMember = {
  id: string
  full_name: string
  relationship: Relationship
  birth_date: string // "YYYY-MM-DD"
  gender?: string | null
  document?: string | null
  notes?: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export type FamilyMemberInput = {
  full_name: string
  relationship: Relationship
  birth_date: string
  gender?: string | null
  document?: string | null
  notes?: string | null
  active: boolean
}

export type Lab = {
  id: string
  name: string
  website_url?: string | null
  exam_results_url?: string | null
  contact_phone?: string | null
  address?: string | null
  notes?: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export type LabInput = {
  name: string
  website_url?: string | null
  exam_results_url?: string | null
  contact_phone?: string | null
  address?: string | null
  notes?: string | null
  active: boolean
}

export type ComparabilityClass = string

export type Marker = {
  id: string
  canonical_name: string
  category: string
  comparability_class: ComparabilityClass
  canonical_unit?: string | null
  aliases?: string[]
  system?: boolean
  created_at?: string
  updated_at?: string
}

export type MarkerInput = {
  canonical_name: string
  category: string
  comparability_class: ComparabilityClass
  canonical_unit?: string | null
  aliases?: string[]
}

export type Paginated<T> = { items: T[]; total: number }

export type MarkerConflict = {
  error: string
  suggestion: Marker
}

export type MarkerResolveItem = {
  raw_name: string
  status: string
  matched?: Marker | null
  candidates?: Marker[]
}

// Exam Results
export type ExamSourceType = string
export type ExamStatus = string

export type ExamResultItem = {
  id?: string
  marker_id?: string | null
  raw_marker_name?: string | null
  result_value: string | number
  unit?: string | null
  reference_min?: number | null
  reference_max?: number | null
  reference_text?: string | null
  method?: string | null
  material?: string | null
}

export type ExamResult = {
  id: string
  family_member_id: string
  lab_id?: string | null
  exam_date: string
  source_type: ExamSourceType
  status: ExamStatus
  summary?: string | null
  notes?: string | null
  items: ExamResultItem[]
  created_at?: string
  updated_at?: string
}

export type ExamResultInput = {
  family_member_id: string
  lab_id?: string | null
  exam_date: string
  source_type: ExamSourceType
  status: ExamStatus
  summary?: string | null
  notes?: string | null
  items: ExamResultItem[]
}

// Exam Requests
export type ExamRequestItem = {
  id?: string
  marker_id?: string | null
  exam_name: string
  exam_code?: string | null
  body_area?: string | null
}

export type ExamRequest = {
  id: string
  family_member_id: string
  request_date: string
  lab_id?: string | null
  status: string
  notes?: string | null
  items: ExamRequestItem[]
  created_at?: string
  updated_at?: string
}

export type ExamRequestInput = {
  family_member_id: string
  request_date: string
  lab_id?: string | null
  status: string
  notes?: string | null
  items: ExamRequestItem[]
}

// Dashboard
export type HealthDashboard = {
  family_members: number
  exam_results: number
  tenant_markers: number
  documents_pending_review: number
}

export type EvolutionMode = 'absolute' | 'normalized'

export type EvolutionPoint = {
  exam_date: string
  value: number
  unit?: string | null
  reference_min?: number | null
  reference_max?: number | null
  reference_text?: string | null
  lab_id?: string | null
  interpretation?: string | null
  normalized?: number | null
}

export type MarkerEvolution = {
  marker: {
    id: string
    canonical_name: string
    canonical_unit?: string | null
    comparability_class: ComparabilityClass
  }
  default_mode: EvolutionMode
  points: EvolutionPoint[]
}

// Documents
export type HealthDocument = {
  id: string
  document_type: string
  family_member_id?: string | null
  file_name?: string | null
  status?: string | null
  created_at?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Family Members
// ---------------------------------------------------------------------------

export async function listFamilyMembers(): Promise<FamilyMember[]> {
  const { data } = await meufinClient.get<Paginated<FamilyMember>>(`${BASE}/family-members`, {
    params: { limit: 500 },
  })
  return data.items
}

/** Variante paginada para a tela de gestão. */
export async function listFamilyMembersPaged(params: {
  limit: number
  offset: number
  query?: string
  relationship?: string
  active?: boolean
}): Promise<Paginated<FamilyMember>> {
  const { data } = await meufinClient.get<Paginated<FamilyMember>>(`${BASE}/family-members`, {
    params,
  })
  return data
}

export async function getFamilyMember(id: string): Promise<FamilyMember> {
  const { data } = await meufinClient.get<FamilyMember>(`${BASE}/family-members/${id}`)
  return data
}

export async function createFamilyMember(input: FamilyMemberInput): Promise<FamilyMember> {
  const { data } = await meufinClient.post<FamilyMember>(`${BASE}/family-members`, input)
  return data
}

export async function updateFamilyMember(id: string, input: FamilyMemberInput): Promise<FamilyMember> {
  const { data } = await meufinClient.put<FamilyMember>(`${BASE}/family-members/${id}`, input)
  return data
}

export async function deleteFamilyMember(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/family-members/${id}`)
}

// ---------------------------------------------------------------------------
// Labs
// ---------------------------------------------------------------------------

export async function listLabs(): Promise<Lab[]> {
  const { data } = await meufinClient.get<Paginated<Lab>>(`${BASE}/labs`, {
    params: { limit: 500 },
  })
  return data.items
}

/** Variante paginada para a tela de gestão. */
export async function listLabsPaged(params: {
  limit: number
  offset: number
  query?: string
  active?: boolean
}): Promise<Paginated<Lab>> {
  const { data } = await meufinClient.get<Paginated<Lab>>(`${BASE}/labs`, { params })
  return data
}

export async function getLab(id: string): Promise<Lab> {
  const { data } = await meufinClient.get<Lab>(`${BASE}/labs/${id}`)
  return data
}

export async function createLab(input: LabInput): Promise<Lab> {
  const { data } = await meufinClient.post<Lab>(`${BASE}/labs`, input)
  return data
}

export async function updateLab(id: string, input: LabInput): Promise<Lab> {
  const { data } = await meufinClient.put<Lab>(`${BASE}/labs/${id}`, input)
  return data
}

export async function deleteLab(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/labs/${id}`)
}

// ---------------------------------------------------------------------------
// Markers (catálogo de exames)
// ---------------------------------------------------------------------------

export type ListMarkersParams = {
  query?: string
  category?: string
  limit?: number
  offset?: number
}

export async function listMarkers(params: ListMarkersParams = {}): Promise<Paginated<Marker>> {
  const { data } = await meufinClient.get<Paginated<Marker>>(`${BASE}/markers`, { params })
  return data
}

export async function getMarker(id: string): Promise<Marker> {
  const { data } = await meufinClient.get<Marker>(`${BASE}/markers/${id}`)
  return data
}

/**
 * Cria um marcador do tenant. Em duplicata a API responde 409 com
 * { error, suggestion }. O erro é propagado (axios) para o chamador tratar.
 */
export async function createMarker(input: MarkerInput): Promise<Marker> {
  const { data } = await meufinClient.post<Marker>(`${BASE}/markers`, input)
  return data
}

export async function updateMarker(id: string, input: MarkerInput): Promise<Marker> {
  const { data } = await meufinClient.put<Marker>(`${BASE}/markers/${id}`, input)
  return data
}

export async function deleteMarker(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/markers/${id}`)
}

export async function resolveMarkers(rawNames: string[]): Promise<MarkerResolveItem[]> {
  const { data } = await meufinClient.post<{ items: MarkerResolveItem[] }>(`${BASE}/markers/resolve`, {
    items: rawNames.map((raw_name) => ({ raw_name })),
  })
  return data.items
}

// ---------------------------------------------------------------------------
// Exam Results
// ---------------------------------------------------------------------------

export async function listExamResults(): Promise<ExamResult[]> {
  const { data } = await meufinClient.get<Paginated<ExamResult>>(`${BASE}/exam-results`, {
    params: { limit: 500 },
  })
  return data.items
}

/** Variante paginada para a tela de gestão. */
export async function listExamResultsPaged(params: {
  limit: number
  offset: number
  query?: string
  family_member_id?: string
  status?: string
}): Promise<Paginated<ExamResult>> {
  const { data } = await meufinClient.get<Paginated<ExamResult>>(`${BASE}/exam-results`, {
    params,
  })
  return data
}

export async function getExamResult(id: string): Promise<ExamResult> {
  const { data } = await meufinClient.get<ExamResult>(`${BASE}/exam-results/${id}`)
  return data
}

export async function createExamResult(input: ExamResultInput): Promise<ExamResult> {
  const { data } = await meufinClient.post<ExamResult>(`${BASE}/exam-results`, input)
  return data
}

export async function updateExamResult(
  id: string,
  input: Partial<ExamResultInput>
): Promise<ExamResult> {
  const { data } = await meufinClient.put<ExamResult>(`${BASE}/exam-results/${id}`, input)
  return data
}

export async function deleteExamResult(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/exam-results/${id}`)
}

export async function addExamResultItem(
  resultId: string,
  item: ExamResultItem
): Promise<ExamResultItem> {
  const { data } = await meufinClient.post<ExamResultItem>(
    `${BASE}/exam-results/${resultId}/items`,
    item
  )
  return data
}

export async function updateExamResultItem(
  resultId: string,
  itemId: string,
  item: ExamResultItem
): Promise<ExamResultItem> {
  const { data } = await meufinClient.put<ExamResultItem>(
    `${BASE}/exam-results/${resultId}/items/${itemId}`,
    item
  )
  return data
}

export async function deleteExamResultItem(resultId: string, itemId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/exam-results/${resultId}/items/${itemId}`)
}

// ---------------------------------------------------------------------------
// Exam Requests
// ---------------------------------------------------------------------------

export async function listExamRequests(): Promise<ExamRequest[]> {
  const { data } = await meufinClient.get<Paginated<ExamRequest>>(`${BASE}/exam-requests`)
  return data.items
}

export async function getExamRequest(id: string): Promise<ExamRequest> {
  const { data } = await meufinClient.get<ExamRequest>(`${BASE}/exam-requests/${id}`)
  return data
}

export async function createExamRequest(input: ExamRequestInput): Promise<ExamRequest> {
  const { data } = await meufinClient.post<ExamRequest>(`${BASE}/exam-requests`, input)
  return data
}

export async function updateExamRequest(
  id: string,
  input: Partial<ExamRequestInput>
): Promise<ExamRequest> {
  const { data } = await meufinClient.put<ExamRequest>(`${BASE}/exam-requests/${id}`, input)
  return data
}

export async function deleteExamRequest(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/exam-requests/${id}`)
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getHealthDashboard(): Promise<HealthDashboard> {
  const { data } = await meufinClient.get<HealthDashboard>(`${BASE}/dashboard`)
  return data
}

export type MarkerEvolutionParams = {
  family_member_id?: string
  from?: string
  to?: string
}

export async function getMarkerEvolution(
  markerId: string,
  params: MarkerEvolutionParams = {}
): Promise<MarkerEvolution> {
  const { data } = await meufinClient.get<MarkerEvolution>(
    `${BASE}/dashboard/markers/${markerId}/evolution`,
    { params }
  )
  return data
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function listDocuments(): Promise<HealthDocument[]> {
  const { data } = await meufinClient.get<Paginated<HealthDocument>>(`${BASE}/documents`)
  return data.items
}

export async function uploadDocument(form: FormData): Promise<HealthDocument> {
  const { data } = await meufinClient.post<HealthDocument>(`${BASE}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getDocumentDownloadUrl(id: string): Promise<{ url: string }> {
  const { data } = await meufinClient.get<{ url: string }>(`${BASE}/documents/${id}/download-url`)
  return data
}

export async function extractDocument(id: string): Promise<unknown> {
  const { data } = await meufinClient.post(`${BASE}/documents/${id}/extract`)
  return data
}

export async function getDocumentExtractionStatus(id: string): Promise<unknown> {
  const { data } = await meufinClient.get(`${BASE}/documents/${id}/extraction-status`)
  return data
}

// ---------------------------------------------------------------------------
// Documentos pessoais do membro (cpf, rg, cnh, ...)
// ---------------------------------------------------------------------------

export type MemberDocType =
  | 'cpf'
  | 'rg'
  | 'cnh'
  | 'passaporte'
  | 'carteira_trabalho'
  | 'certidao_nascimento'
  | 'titulo_eleitor'
  | 'cartao_sus'
  | 'plano_saude'
  | 'outro'

export type MemberDocument = {
  id: string
  family_member_id: string
  doc_type: MemberDocType
  label?: string | null
  doc_number?: string | null
  valid_until?: string | null // "YYYY-MM-DD"
  notes?: string | null
  file_name: string
  original_file_name: string
  mime_type: string
  size_bytes: number
  created_at?: string
  updated_at?: string
}

export type MemberDocumentInput = {
  doc_type: MemberDocType
  label?: string | null
  doc_number?: string | null
  valid_until?: string | null
  notes?: string | null
  file: File
}

export async function listMemberDocuments(memberId: string): Promise<MemberDocument[]> {
  const { data } = await meufinClient.get<Paginated<MemberDocument>>(
    `${BASE}/family-members/${memberId}/documents`
  )
  return data.items ?? []
}

/** Upload multipart: file + doc_type (+ label, doc_number, valid_until, notes). */
export async function uploadMemberDocument(
  memberId: string,
  input: MemberDocumentInput
): Promise<MemberDocument> {
  const form = new FormData()
  form.append('file', input.file)
  form.append('doc_type', input.doc_type)
  if (input.label) form.append('label', input.label)
  if (input.doc_number) form.append('doc_number', input.doc_number)
  if (input.valid_until) form.append('valid_until', input.valid_until)
  if (input.notes) form.append('notes', input.notes)
  const { data } = await meufinClient.post<MemberDocument>(
    `${BASE}/family-members/${memberId}/documents`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function memberDocumentDownloadURL(memberId: string, docId: string): Promise<string> {
  const { data } = await meufinClient.get<{ url: string }>(
    `${BASE}/family-members/${memberId}/documents/${docId}/download-url`
  )
  return data.url
}

export async function deleteMemberDocument(memberId: string, docId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/family-members/${memberId}/documents/${docId}`)
}
