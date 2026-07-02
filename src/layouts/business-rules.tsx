import type { SvgIconComponent } from '@mui/icons-material'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded'
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'

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
  'finance.dashboard': {
    title: 'Como os números da dashboard são calculados',
    icon: InsightsRoundedIcon,
    blocks: [
      {
        type: 'paragraph',
        text: 'A dashboard responde 4 perguntas: como estou este mês, o que ainda vem, pra onde foi o dinheiro e quanto do futuro já está comprometido.',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Fatura de cartão não duplica',
        text: 'A fatura entra pelo total; as compras dentro dela ficam de fora dos totais. Já no gráfico de categorias é o contrário: valem as compras (com a categoria real de cada uma), não a fatura.',
      },
      {
        type: 'list',
        items: [
          'Realizado usa o valor efetivamente pago quando informado na liquidação (juros/multa/desconto contam).',
          'Previsto = tudo que não foi cancelado (previstas + realizadas).',
          'A pagar / A receber = lançamentos ainda previstos no mês.',
          'Parcelas futuras somam parcelas previstas que vencem após o mês selecionado.',
          'Lançamentos cancelados nunca entram em nenhum número.',
        ],
      },
      {
        type: 'callout',
        tone: 'info',
        title: 'Filtro por membro',
        text: 'Faturas de cartão não têm membro atribuído — com o filtro de membro ativo, elas (e suas compras) saem da conta.',
      },
    ],
  },
  'finance.payables': {
    title: 'Liquidação: pagar/receber com rastro',
    icon: TaskAltRoundedIcon,
    blocks: [
      {
        type: 'paragraph',
        text: 'Liquidar registra QUANDO, QUANTO e COMO o lançamento foi pago (ou recebido): forma de pagamento, conta ou cartão e comprovantes.',
      },
      {
        type: 'list',
        items: [
          'O valor pago pode diferir do previsto — juros, multa ou desconto. Guardamos os dois.',
          'Liquidar uma fatura de cartão liquida todas as compras dentro dela (cascata). Cancelar idem.',
          'Pix, débito, transferência e boleto podem apontar a conta de origem; dinheiro não precisa.',
          'Comprovante aceita PDF, foto (JPG/PNG/HEIC/WebP) e DOC — quantos arquivos quiser.',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'Pagou com cartão de crédito?',
        text: 'A despesa sai agora do status previsto, mas o dinheiro só sai de verdade na fatura do cartão. Registre a compra na fatura também — por enquanto o sistema não faz isso sozinho.',
      },
    ],
  },
  'finance.invoices': {
    title: 'Fatura pai e compras filhas',
    icon: ReceiptLongRoundedIcon,
    blocks: [
      {
        type: 'paragraph',
        text: 'Uma fatura importada vira um lançamento pai (total da fatura) com compras filhas (cada item, com categoria própria).',
      },
      {
        type: 'list',
        items: [
          'Totais e gráficos usam o pai — as filhas não duplicam o valor.',
          'O gráfico de categorias usa as filhas — é nelas que mora a categoria real.',
          'Liquidar/cancelar o pai propaga para as filhas automaticamente.',
          'Parcelas de compras importadas valem só para a fatura atual; as futuras ainda não são geradas automaticamente.',
        ],
      },
    ],
  },
}
