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

/**
 * Categorias do catálogo de exames. `value` = chave usada pelo backend (seed em PT),
 * `label` = rótulo em português exibido na UI. Campo continua livre no cadastro.
 */
export const MARKER_CATEGORIES: { value: string; label: string }[] = [
  { value: 'hematologia', label: 'Hematologia' },
  { value: 'bioquimica', label: 'Bioquímica' },
  { value: 'lipidico', label: 'Perfil lipídico' },
  { value: 'hepatico', label: 'Hepático' },
  { value: 'renal', label: 'Renal' },
  { value: 'eletrolitos', label: 'Eletrólitos' },
  { value: 'hormonios', label: 'Hormônios' },
  { value: 'vitaminas', label: 'Vitaminas' },
  { value: 'inflamacao', label: 'Inflamação' },
  { value: 'outros', label: 'Outros' },
]

/** Mapa chave -> rótulo PT para exibição (ex.: na tabela). */
export const MARKER_CATEGORY_LABEL: Record<string, string> = MARKER_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<string, string>,
)

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
  memberDocuments: (memberId: string) =>
    [...healthKeys.all, 'member-documents', memberId] as const,
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

/** Tipos de documento pessoal do membro. */
export const MEMBER_DOC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'cpf', label: 'CPF' },
  { value: 'rg', label: 'RG' },
  { value: 'cnh', label: 'CNH' },
  { value: 'passaporte', label: 'Passaporte' },
  { value: 'carteira_trabalho', label: 'Carteira de Trabalho' },
  { value: 'certidao_nascimento', label: 'Certidão de Nascimento' },
  { value: 'titulo_eleitor', label: 'Título de Eleitor' },
  { value: 'cartao_sus', label: 'Cartão SUS' },
  { value: 'plano_saude', label: 'Plano de Saúde' },
  { value: 'outro', label: 'Outro (informe o rótulo)' },
]

export const MEMBER_DOC_TYPE_LABEL: Record<string, string> = MEMBER_DOC_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<string, string>
)
