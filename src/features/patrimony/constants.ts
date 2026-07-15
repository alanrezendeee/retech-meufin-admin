import type { PropertyType, PropertyDocType, TaxType, TaxStatus, AssetType } from './api'

export const patrimonyKeys = {
  all: ['patrimony'] as const,
  properties: (params: Record<string, unknown>) => [...patrimonyKeys.all, 'properties', params] as const,
  property: (id: string) => [...patrimonyKeys.all, 'property', id] as const,
  documents: (propertyId: string) => [...patrimonyKeys.all, 'documents', propertyId] as const,
  taxes: (params: Record<string, unknown>) => [...patrimonyKeys.all, 'taxes', params] as const,
  overview: () => [...patrimonyKeys.all, 'overview'] as const,
}

// ─── Property ─────────────────────────────────────────────────────────────────

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'rural', label: 'Rural' },
  { value: 'outros', label: 'Outros' },
]

export const PROPERTY_TYPE_LABEL: Record<PropertyType, string> = PROPERTY_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<PropertyType, string>,
)

// ─── Documents ──────────────────────────────────────────────────────────────────

export const PROPERTY_DOC_TYPE_OPTIONS: { value: PropertyDocType; label: string }[] = [
  { value: 'escritura', label: 'Escritura' },
  { value: 'matricula', label: 'Matrícula' },
  { value: 'iptu', label: 'Carnê de IPTU' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'seguro', label: 'Apólice de seguro' },
  { value: 'planta', label: 'Planta' },
  { value: 'outros', label: 'Outros' },
]

export const PROPERTY_DOC_TYPE_LABEL: Record<PropertyDocType, string> = PROPERTY_DOC_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<PropertyDocType, string>,
)

// ─── Taxes ────────────────────────────────────────────────────────────────────

export const ASSET_TYPE_OPTIONS: { value: AssetType; label: string }[] = [
  { value: 'property', label: 'Imóvel' },
  { value: 'vehicle', label: 'Veículo' },
]

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  property: 'Imóvel',
  vehicle: 'Veículo',
}

export const TAX_TYPE_OPTIONS: { value: TaxType; label: string }[] = [
  { value: 'iptu', label: 'IPTU' },
  { value: 'ipva', label: 'IPVA' },
  { value: 'licenciamento', label: 'Licenciamento' },
  { value: 'dpvat', label: 'DPVAT' },
  { value: 'condominio', label: 'Condomínio' },
  { value: 'seguro_predial', label: 'Seguro predial' },
  { value: 'taxa_lixo', label: 'Taxa de lixo' },
  { value: 'taxa_bombeiros', label: 'Taxa de bombeiros' },
  { value: 'outros', label: 'Outros' },
]

export const TAX_TYPE_LABEL: Record<TaxType, string> = TAX_TYPE_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<TaxType, string>,
)

export const TAX_STATUS_OPTIONS: { value: TaxStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'partial', label: 'Parcial' },
]

export const TAX_STATUS_LABEL: Record<TaxStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencido',
  partial: 'Parcial',
}

export const TAX_STATUS_COLOR: Record<TaxStatus, 'default' | 'success' | 'error' | 'warning'> = {
  pending: 'default',
  paid: 'success',
  overdue: 'error',
  partial: 'warning',
}

// ─── Formatters ─────────────────────────────────────────────────────────────────

export function formatCents(v?: number | null): string {
  if (v == null) return '—'
  return (v / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(s?: string | null): string {
  if (!s) return '—'
  const [y, m, d] = s.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function formatArea(v?: number | null): string {
  if (v == null) return '—'
  return `${v.toLocaleString('pt-BR')} m²`
}

export function formatPct(v?: number | null): string {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function errorMessage(err: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  if (typeof err === 'object' && err != null) {
    const anyErr = err as {
      response?: { data?: { error?: string | { message?: string }; message?: string } }
      message?: string
    }
    const apiErr = anyErr.response?.data?.error
    if (typeof apiErr === 'string' && apiErr) return apiErr
    if (apiErr && typeof apiErr === 'object' && typeof apiErr.message === 'string' && apiErr.message) {
      return apiErr.message
    }
    return anyErr.response?.data?.message ?? anyErr.message ?? fallback
  }
  return fallback
}
