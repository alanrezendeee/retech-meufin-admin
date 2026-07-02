import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listExpenseCategories, type ExpenseCategory, type ExpenseGroup } from '../api'
import { financeKeys } from '../constants'

/**
 * Categorias de despesa do workspace (fonte: servidor — o backend semeia as
 * padrão no primeiro uso). labelOf resolve slug→nome com fallback no próprio
 * slug (categorias arquivadas seguem legíveis no histórico).
 */
export function useExpenseCategories(): {
  categories: ExpenseCategory[]
  activeCategories: ExpenseCategory[]
  groups: ExpenseGroup[]
  labelOf: (slug?: string | null) => string
  isLoading: boolean
} {
  const { data, isLoading } = useQuery({
    queryKey: financeKeys.expenseCategories(),
    queryFn: listExpenseCategories,
  })

  const categories = useMemo(() => data?.items ?? [], [data])
  const activeCategories = useMemo(() => categories.filter((c) => c.active), [categories])
  const groups = useMemo(
    () => [...(data?.groups ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  )
  const labelOf = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.name]))
    map.set('cartao', 'Fatura de cartão')
    return (slug?: string | null) => (slug ? (map.get(slug) ?? slug) : '—')
  }, [categories])

  return { categories, activeCategories, groups, labelOf, isLoading }
}
