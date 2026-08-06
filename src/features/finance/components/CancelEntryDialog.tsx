import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelEntry, formatCents, listCancelReasons, type Entry } from '../api'
import { errorMessage, financeKeys } from '../constants'
import { AutocompleteField } from '@/components/fields/AutocompleteField'
import { ErrorState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

/**
 * Cancelamento com motivo. O motivo não é só rótulo: define se a série
 * recorrente é encerrada ou continua nos próximos meses — antes o sistema
 * adivinhava pela posição da ocorrência, e cancelar o mês mais distante
 * matava a recorrência em silêncio.
 */
export function CancelEntryDialog({
  entry,
  onClose,
}: {
  entry: Entry
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [reason, setReason] = useState('')

  const isIncome = entry.kind === 'credit'
  const isRecurring = entry.recurrence !== 'none' && Boolean(entry.recurrence_group_id)

  const reasonsQuery = useQuery({
    queryKey: financeKeys.cancelReasons(),
    queryFn: listCancelReasons,
  })
  const reasons = reasonsQuery.data ?? []
  const selected = reasons.find((r) => r.slug === reason)

  const mutation = useMutation({
    mutationFn: () => cancelEntry(entry.id, reason || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      show(
        selected?.ends_recurrence && isRecurring
          ? 'Cancelado. A recorrência foi encerrada — não haverá novos meses.'
          : isIncome
            ? 'Receita cancelada.'
            : 'Despesa cancelada.'
      )
      onClose()
    },
  })

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Cancelar {isIncome ? 'receita' : 'despesa'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

          <Typography variant="body2" color="text.secondary">
            {entry.description} — {formatCents(entry.amount_cents)}
          </Typography>

          <AutocompleteField
            label="Motivo do cancelamento"
            value={reason}
            onChange={setReason}
            options={reasons.map((r) => ({
              value: r.slug,
              label: r.name,
              description: r.description,
            }))}
            emptyLabel="Nenhum motivo encontrado"
          />

          {isRecurring && selected?.ends_recurrence && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Este motivo <strong>encerra a recorrência</strong>: os meses seguintes deixam de ser
              gerados.
            </Alert>
          )}
          {isRecurring && selected && !selected.ends_recurrence && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              Só este lançamento é cancelado — a recorrência continua nos próximos meses.
            </Alert>
          )}

          <Alert severity="info" sx={{ py: 0.5 }}>
            Cancelar remove o lançamento dos relatórios, sem deixar registro de valor. Se a
            cobrança existia e apenas não foi paga (bônus, cortesia, ressarcimento), use{' '}
            <strong>{isIncome ? 'Não houve recebimento' : 'Não houve cobrança'}</strong>.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Voltar
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => mutation.mutate()}
          disabled={!reason || mutation.isPending}
        >
          Cancelar {isIncome ? 'receita' : 'despesa'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
