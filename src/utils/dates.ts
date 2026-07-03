/**
 * Formata datas ISO para pt-BR (dd/mm/aaaa).
 *
 * 'YYYY-MM-DD' é tratado como data-calendário (sem fuso — new Date('2026-07-01')
 * cairia em 30/06 em GMT-3). ISO completo (timestamps) usa o fuso local.
 */
export function formatDateBR(iso?: string | null): string {
  if (!iso) return '—'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (dateOnly && iso.length === 10) {
    return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return dateOnly ? `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}` : iso
  }
  return d.toLocaleDateString('pt-BR')
}

/** Data + hora locais (dd/mm/aaaa hh:mm) para timestamps de auditoria. */
export function formatDateTimeBR(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return formatDateBR(iso)
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}
