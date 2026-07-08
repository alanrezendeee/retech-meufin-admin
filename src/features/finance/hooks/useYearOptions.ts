import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEntryYearBounds } from '../api'
import { financeKeys, yearOptions } from '../constants'

/**
 * Anos para o filtro, derivados dos lançamentos reais do workspace
 * (menor..maior ano de vencimento), sempre incluindo ano atual ±2.
 * Fallback (sem dados / carregando): ano atual ±2.
 */
export function useYearOptions(): number[] {
  const { data } = useQuery({
    queryKey: financeKeys.yearBounds(),
    queryFn: getEntryYearBounds,
    staleTime: 5 * 60 * 1000,
  })

  return useMemo(() => {
    const now = new Date().getFullYear()
    if (!data?.min_year || !data?.max_year) return yearOptions()
    // Guarda contra datas absurdas (digitação errada) sem esconder o range real.
    const min = Math.max(Math.min(now - 2, data.min_year), now - 30)
    const max = Math.min(Math.max(now + 2, data.max_year), now + 50)
    const out: number[] = []
    for (let y = min; y <= max; y++) out.push(y)
    return out
  }, [data])
}
