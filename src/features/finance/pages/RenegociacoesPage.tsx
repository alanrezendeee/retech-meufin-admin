import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import HandshakeRoundedIcon from '@mui/icons-material/HandshakeRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import { useQuery } from '@tanstack/react-query'
import {
  formatCents,
  getRenegotiationDetail,
  listRenegotiations,
  type Entry,
  type Renegotiation,
} from '../api'
import { errorMessage, financeKeys } from '../constants'
import { PageHeader } from '@/features/health/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'

function formatDateBR(iso: string): string {
  if (!iso || iso.length < 10) return iso
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/**
 * Chip do ajuste: positivo = encargo/juros (a dívida cresceu no acordo),
 * negativo = desconto obtido. O valor está DILUÍDO nas parcelas novas — é
 * assim que a contabilidade reconhece juros capitalizados, ao longo do
 * prazo — e esta tela existe para ele não ficar invisível por causa disso.
 */
function AdjustmentChip({ cents }: { cents: number }) {
  if (cents > 0) {
    return <Chip size="small" color="error" variant="outlined" label={`+${formatCents(cents)} juros`} />
  }
  if (cents < 0) {
    return <Chip size="small" color="success" variant="outlined" label={`−${formatCents(-cents)} desconto`} />
  }
  return <Chip size="small" variant="outlined" label="sem ajuste" />
}

function EntriesTable({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        {title} ({entries.length})
      </Typography>
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 260 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell sx={{ width: 110 }}>Vencimento</TableCell>
              <TableCell sx={{ width: 80 }} align="right">
                Parcela
              </TableCell>
              <TableCell sx={{ width: 120 }} align="right">
                Valor
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>{e.description}</TableCell>
                <TableCell>{formatDateBR(e.due_date)}</TableCell>
                <TableCell align="right">
                  {e.installment_number && e.installment_total
                    ? `${e.installment_number}/${e.installment_total}`
                    : '—'}
                </TableCell>
                <TableCell align="right">{formatCents(e.amount_cents)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

function RenegotiationDetailDialog({
  renegotiation,
  onClose,
}: {
  renegotiation: Renegotiation
  onClose: () => void
}) {
  const detailQ = useQuery({
    queryKey: [...financeKeys.renegotiations(), renegotiation.id] as const,
    queryFn: () => getRenegotiationDetail(renegotiation.id),
  })
  const d = detailQ.data

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {renegotiation.description} — {formatDateBR(renegotiation.date)}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Saldo apurado
              </Typography>
              <Typography variant="h6">{formatCents(renegotiation.settled_amount_cents)}</Typography>
            </Box>
            <Typography variant="h6" color="text.secondary">
              →
            </Typography>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Novo acordo
              </Typography>
              <Typography variant="h6">{formatCents(renegotiation.new_amount_cents)}</Typography>
            </Box>
            <AdjustmentChip cents={renegotiation.adjustment_cents} />
          </Box>

          {renegotiation.notes && (
            <Typography variant="body2" color="text.secondary">
              {renegotiation.notes}
            </Typography>
          )}

          {detailQ.isLoading && <LoadingState label="Carregando o detalhe…" />}
          {detailQ.isError && <ErrorState message={errorMessage(detailQ.error)} />}
          {d && (
            <>
              <EntriesTable title="Cobranças encerradas pelo acordo" entries={d.origins} />
              <EntriesTable title="Parcelas criadas" entries={d.created} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function RenegociacoesPage() {
  const [selected, setSelected] = useState<Renegotiation | null>(null)

  const listQ = useQuery({
    queryKey: financeKeys.renegotiations(),
    queryFn: listRenegotiations,
  })
  const items = useMemo(() => listQ.data ?? [], [listQ.data])

  const totals = useMemo(() => {
    let settled = 0
    let interest = 0
    let discount = 0
    for (const r of items) {
      settled += r.settled_amount_cents
      if (r.adjustment_cents > 0) interest += r.adjustment_cents
      if (r.adjustment_cents < 0) discount += -r.adjustment_cents
    }
    return { settled, interest, discount }
  }, [items])

  return (
    <>
      <PageHeader
        title="Renegociações"
        subtitle="Acordos que substituíram dívidas em aberto — e quanto cada um custou (ou economizou)."
      />

      {listQ.isLoading && <LoadingState label="Carregando renegociações…" />}
      {listQ.isError && <ErrorState message={errorMessage(listQ.error)} />}

      {listQ.isSuccess && items.length === 0 && (
        <EmptyState
          title="Nenhuma renegociação registrada"
          description="Renegocie uma dívida parcelada pela tela de Parcelamentos: o saldo em aberto é apurado e substituído por um novo acordo, preservando o histórico."
        />
      )}

      {items.length > 0 && (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Dívida renegociada
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {formatCents(totals.settled)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {items.length} acordo(s)
                      </Typography>
                    </Box>
                    <HandshakeRoundedIcon color="info" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Custo em juros/encargos
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="error.main">
                        {formatCents(totals.interest)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        diluídos nas parcelas novas
                      </Typography>
                    </Box>
                    <TrendingUpRoundedIcon color="error" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Descontos obtidos
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        {formatCents(totals.discount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        abatidos do saldo devido
                      </Typography>
                    </Box>
                    <SavingsRoundedIcon color="success" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 110 }}>Data</TableCell>
                    <TableCell>Dívida</TableCell>
                    <TableCell align="right">Saldo apurado</TableCell>
                    <TableCell align="right">Novo acordo</TableCell>
                    <TableCell>Ajuste</TableCell>
                    <TableCell align="right">Cobranças</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((r) => (
                    <TableRow
                      key={r.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => setSelected(r)}
                    >
                      <TableCell>{formatDateBR(r.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.description}</TableCell>
                      <TableCell align="right">{formatCents(r.settled_amount_cents)}</TableCell>
                      <TableCell align="right">{formatCents(r.new_amount_cents)}</TableCell>
                      <TableCell>
                        <AdjustmentChip cents={r.adjustment_cents} />
                      </TableCell>
                      <TableCell align="right">
                        {r.origin_count} → {r.new_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Typography variant="caption" color="text.secondary">
            O ajuste está embutido nas parcelas do novo acordo — juros capitalizados são
            reconhecidos ao longo do prazo, não no mês da assinatura. Esta tela existe para esse
            custo nunca ficar invisível. Clique num acordo para ver as cobranças encerradas e as
            parcelas criadas.
          </Typography>
        </Stack>
      )}

      {selected && (
        <RenegotiationDetailDialog renegotiation={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
