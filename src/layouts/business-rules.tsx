import type { SvgIconComponent } from '@mui/icons-material'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded'

/**
 * Registro central de REGRAS DE NEGÓCIO complexas/críticas, exibidas na UI
 * via popover no ícone ⓘ ao lado do item de menu (padrão BioPass).
 *
 * Texto limpo e direto ao ponto. Uma entrada por chave (`info` do item de menu).
 */

export type BusinessRuleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'callout'; tone: 'info' | 'warning'; title: string; text: string }

export type BusinessRule = {
  title: string
  icon?: SvgIconComponent
  blocks: BusinessRuleBlock[]
}

export const businessRules: Record<string, BusinessRule> = {
  'health.markers': {
    title: 'Catálogo de exames sem duplicatas',
    icon: BiotechRoundedIcon,
    blocks: [
      {
        type: 'paragraph',
        text: 'Cada marcador (glicose, hematócrito, ferritina…) tem identidade única no catálogo. É isso que mantém o histórico correto ao longo do tempo.',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Por que não pode duplicar',
        text: 'Se “Glicose” e “glicemia” virassem 2 cadastros, o gráfico de evolução se quebraria em séries separadas — histórico inútil.',
      },
      {
        type: 'list',
        items: [
          'O nome é normalizado (sem acento/maiúscula) e comparado a nomes e apelidos existentes.',
          'Igual → bloqueia e sugere o marcador existente.',
          'Parecido → alerta antes de criar (fuzzy).',
          'Catálogo base compartilhado + os marcadores do seu workspace.',
        ],
      },
    ],
  },
  'health.results': {
    title: 'Referência varia por laboratório',
    icon: MonitorHeartRoundedIcon,
    blocks: [
      {
        type: 'paragraph',
        text: 'A faixa de referência muda entre labs (método, equipamento, população). Guardamos a referência de cada resultado, não uma global.',
      },
      {
        type: 'list',
        items: [
          'Padronizados (hematócrito, glicose): valor comparável → 1 gráfico absoluto com todos os labs.',
          'Dependentes de método (ferritina, vitamina D): o padrão é o modo normalizado.',
        ],
      },
      {
        type: 'code',
        text: "x' = 2·(x − min) / (max − min) − 1",
      },
      {
        type: 'paragraph',
        text: 'O modo normalizado põe cada ponto na posição da própria referência — assim dá para comparar labs diferentes num gráfico só.',
      },
    ],
  },
}
