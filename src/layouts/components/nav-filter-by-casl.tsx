import type { SvgIconComponent } from '@mui/icons-material'
import { useMemo } from 'react'
import { useAbility } from '@/auth/casl/use-ability'
import type { NavItemPermission } from '@/auth/guard/permission-guard'

export type NavDataItem = {
  label: string
  path: string
  icon: SvgIconComponent
  soon?: boolean
  permission?: NavItemPermission
  children?: NavDataItem[]
  /** Chave em `businessRules` — exibe o ícone ⓘ com a regra de negócio no hover. */
  info?: string
}

export type NavDataSection = {
  subheader?: string
  items: NavDataItem[]
}

function filterItems(items: NavDataItem[], ability: ReturnType<typeof useAbility>, isMaster: boolean): NavDataItem[] {
  const out: NavDataItem[] = []

  for (const item of items) {
    const filteredChildren = item.children?.length
      ? filterItems(item.children, ability, isMaster)
      : undefined

    const passesPermission =
      !item.permission || isMaster || ability.can(item.permission.action, item.permission.subject)

    if (!passesPermission) {
      continue
    }

    if (item.children?.length && filteredChildren && filteredChildren.length === 0) {
      continue
    }

    out.push({
      ...item,
      ...(filteredChildren != null ? { children: filteredChildren } : {}),
    })
  }

  return out
}

/**
 * Filtra itens do menu pela Ability CASL (retechauth-api).
 * Sem `permission` → item sempre visível; com `permission` → can(action, subject) ou master.
 */
export function useFilteredNavData(navData: NavDataSection[]): NavDataSection[] {
  const ability = useAbility()
  const isMaster = ability.can('manage', 'all')

  return useMemo(() => {
    return navData
      .map((section) => ({
        ...section,
        items: filterItems(section.items, ability, isMaster),
      }))
      .filter((s) => s.items.length > 0)
  }, [navData, ability, isMaster])
}
