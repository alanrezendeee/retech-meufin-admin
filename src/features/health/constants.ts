import type { Relationship } from './api'

export const RELATIONSHIP_OPTIONS: { value: Relationship; label: string }[] = [
  { value: 'self', label: 'Eu' },
  { value: 'spouse', label: 'Cônjuge' },
  { value: 'child', label: 'Filho(a)' },
  { value: 'parent', label: 'Pai/Mãe' },
  { value: 'other', label: 'Outro' },
]

export const RELATIONSHIP_LABEL: Record<Relationship, string> = RELATIONSHIP_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<Relationship, string>
)

export const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'other', label: 'Outro' },
]

/** Categorias comuns do catálogo de exames (sugestões — campo é livre). */
export const MARKER_CATEGORIES: string[] = [
  'hematology',
  'biochemistry',
  'lipids',
  'hormones',
  'vitamins',
  'urine',
  'immunology',
  'other',
]

export const EXAM_SOURCE_TYPES: { value: string; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'document', label: 'Documento' },
  { value: 'import', label: 'Importação' },
]

export const EXAM_RESULT_STATUS: { value: string; label: string }[] = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'reviewed', label: 'Revisado' },
  { value: 'final', label: 'Finalizado' },
]

/** react-query keys centralizados. */
export const healthKeys = {
  all: ['health'] as const,
  dashboard: () => [...healthKeys.all, 'dashboard'] as const,
  evolution: (markerId: string, params: Record<string, unknown>) =>
    [...healthKeys.all, 'evolution', markerId, params] as const,
  familyMembers: () => [...healthKeys.all, 'family-members'] as const,
  labs: () => [...healthKeys.all, 'labs'] as const,
  markers: (params: Record<string, unknown>) => [...healthKeys.all, 'markers', params] as const,
  examResults: () => [...healthKeys.all, 'exam-results'] as const,
  documents: () => [...healthKeys.all, 'documents'] as const,
}

/** Extrai mensagem de erro amigável de erro axios/desconhecido. */
export function errorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (typeof err === 'object' && err != null) {
    const anyErr = err as {
      response?: { data?: { error?: string; message?: string } }
      message?: string
    }
    return (
      anyErr.response?.data?.error ??
      anyErr.response?.data?.message ??
      anyErr.message ??
      fallback
    )
  }
  return fallback
}
