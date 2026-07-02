import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import UpcomingRoundedIcon from '@mui/icons-material/UpcomingRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { useQuery } from '@tanstack/react-query'
import { formatCents, listEntries, type Entry, type EntryKind } from '../api'
import {
  errorMessage,
  EXPENSE_CATEGORY_LABEL,
  financeKeys,
  INCOME_TYPE_LABEL,
} from '../constants'
import { SettleEntryDialog } from '../components/SettleEntryDialog'
import { PageHeader } from '@/features/health/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatDueDate(due: string): string {
  const [y, m, d] = due.split('-')
  return `${d}/${m}/${y}`
}

function categoryLabel(e: Entry): string {
  if (!e.type) return '—'
  if ((e.type as string) === 'cartao') return 'Fatura de cartão'
  return e.kind === 'debit'
    ? (EXPENSE_CATEGORY_LABEL[e.type] ?? e.type)
    : (INCOME_TYPE_LABEL[e.type] ?? e.type)
}

function EntriesTable({
  entries,
  kind,
  onSettle,
}: {
  entries: Entry[]
  kind: EntryKind
  onSettle: (e: Entry) => void
}) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Vencimento</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDueDate(e.due_date)}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {e.description || 'Sem descrição'}
                {e.installment_number != null && e.installment_total != null && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${e.installment_number}/${e.installment_total}`}
                    sx={{ ml: 1 }}
                  />
                )}
              </TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>{categoryLabel(e)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                {formatCents(e.amount_cents)}
              </TableCell>
              <TableCell align="right">
                <Tooltip title={kind === 'debit' ? 'Pagar (liquidar)' : 'Receber (liquidar)'}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<TaskAltRoundedIcon />}
                    onClick={() => onSettle(e)}
                  >
                    Liquidar
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function Section({
  title,
  icon,
  tone,
  totalCents,
  entries,
  kind,
  emptyText,
  onSettle,
}: {
  title: string
  icon: React.ReactNode
  tone: 'error' | 'warning' | 'info'
  totalCents: number
  entries: Entry[]
  kind: EntryKind
  emptyText: string
  onSettle: (e: Entry) => void
}) {
  return (
    <Card>
      <CardContent sx={{ pb: entries.length ? 0 : undefined }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ color: `${tone}.main`, display: 'flex' }}>{icon}</Box>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            <Chip size="small" label={entries.length} />
          </Stack>
          {entries.length > 0 && (
            <Typography variant="subtitle1" fontWeight={800} color={`${tone}.main`}>
              {formatCents(totalCents)}
            </Typography>
          )}
        </Stack>
        {entries.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ pb: 1 }}>
            {emptyText}
          </Typography>
        )}
      </CardContent>
      {entries.length > 0 && <EntriesTable entries={entries} kind={kind} onSettle={onSettle} />}
    </Card>
  )
}

export default function ContasDoDiaPage() {
  const [kind, setKind] = useState<EntryKind>('debit')
  const [settling, setSettling] = useState<Entry | null>(null)

  const today = useMemo(() => new Date(), [])
  const todayStr = isoDate(today)
  const tomorrowStr = isoDate(new Date(today.getTime() + 24 * 60 * 60 * 1000))
  const in7Str = isoDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000))

  const common = { kind, status: 'prevista' as const, top_level: true, limit: 200 }

  const overdueQ = useQuery({
    queryKey: financeKeys.entries({ ...common, overdue: true }),
    queryFn: () => listEntries({ ...common, overdue: true }),
  })
  const todayQ = useQuery({
    queryKey: financeKeys.entries({ ...common, due_on: todayStr }),
    queryFn: () => listEntries({ ...common, due_on: todayStr }),
  })
  const upcomingQ = useQuery({
    queryKey: financeKeys.entries({ ...common, due_from: tomorrowStr, due_to: in7Str }),
    queryFn: () => listEntries({ ...common, due_from: tomorrowStr, due_to: in7Str }),
  })

  const isLoading = overdueQ.isLoading || todayQ.isLoading || upcomingQ.isLoading
  const firstError = [overdueQ, todayQ, upcomingQ].find((q) => q.isError)

  const overdue = overdueQ.data?.items ?? []
  const dueToday = todayQ.data?.items ?? []
  const upcoming = upcomingQ.data?.items ?? []

  const sum = (xs: Entry[]) => xs.reduce((acc, e) => acc + e.amount_cents, 0)
  const isExpense = kind === 'debit'
  const nothing = !overdue.length && !dueToday.length && !upcoming.length

  return (
    <>
      <PageHeader
        title="Contas do Dia"
        subtitle="O que vence hoje, o que está atrasado e o que vem nos próximos 7 dias — liquide na hora."
        action={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={kind}
            onChange={(_, v) => v && setKind(v)}
          >
            <ToggleButton value="debit">A pagar</ToggleButton>
            <ToggleButton value="credit">A receber</ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : firstError ? (
        <ErrorState message={errorMessage(firstError.error)} onRetry={() => firstError.refetch()} />
      ) : nothing ? (
        <EmptyState
          icon={<PaidRoundedIcon />}
          title={isExpense ? 'Nada a pagar por aqui' : 'Nada a receber por aqui'}
          description={
            isExpense
              ? 'Nenhuma despesa prevista em atraso, para hoje ou para os próximos 7 dias.'
              : 'Nenhuma receita prevista em atraso, para hoje ou para os próximos 7 dias.'
          }
        />
      ) : (
        <Stack spacing={2.5}>
          <Section
            title="Em atraso"
            icon={<EventBusyRoundedIcon />}
            tone="error"
            totalCents={sum(overdue)}
            entries={overdue}
            kind={kind}
            emptyText="Nada em atraso. 👏"
            onSettle={setSettling}
          />
          <Section
            title="Vencendo hoje"
            icon={<TodayRoundedIcon />}
            tone="warning"
            totalCents={sum(dueToday)}
            entries={dueToday}
            kind={kind}
            emptyText="Nada vencendo hoje."
            onSettle={setSettling}
          />
          <Section
            title="Próximos 7 dias"
            icon={<UpcomingRoundedIcon />}
            tone="info"
            totalCents={sum(upcoming)}
            entries={upcoming}
            kind={kind}
            emptyText="Nada previsto para os próximos 7 dias."
            onSettle={setSettling}
          />
        </Stack>
      )}

      {settling && <SettleEntryDialog entry={settling} onClose={() => setSettling(null)} />}
    </>
  )
}
