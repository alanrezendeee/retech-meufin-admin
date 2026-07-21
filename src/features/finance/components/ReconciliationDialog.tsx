import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import LinkRoundedIcon from '@mui/icons-material/LinkRounded'
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  formatCents,
  getReconciliationSuggestions,
  reconcile,
  type ReconcileMatch,
} from '../api'
import { errorMessage, financeKeys } from '../constants'
import { formatDateBR } from '@/utils/dates'
import { LoadingState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

/**
 * Conciliação cupom × fatura: mostra as compras da fatura que casam com um cupom
 * fiscal de crédito e deixa o usuário VINCULAR cada uma (anexa os itens do cupom
 * à compra e remove a despesa avulsa — sem duplicar). Nada é aplicado sozinho.
 */
export function ReconciliationDialog({
  open,
  invoiceEntryId,
  onClose,
}: {
  open: boolean
  invoiceEntryId: string | null
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  // Linhas já resolvidas (vinculadas ou ignoradas) somem da lista.
  const [handled, setHandled] = useState<Set<string>>(new Set())

  const suggestionsQ = useQuery({
    queryKey: [...financeKeys.all, 'reconciliation', invoiceEntryId] as const,
    queryFn: () => getReconciliationSuggestions(invoiceEntryId as string),
    enabled: open && Boolean(invoiceEntryId),
  })

  const linkMutation = useMutation({
    mutationFn: (m: ReconcileMatch) => reconcile(m.cupom_entry_id, m.purchase_entry_id),
    onSuccess: (_res, m) => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      setHandled((prev) => new Set(prev).add(m.cupom_entry_id))
      show('Cupom vinculado à compra — despesa avulsa removida.')
    },
    onError: (e) => show(errorMessage(e), 'error'),
  })

  const matches = (suggestionsQ.data?.matches ?? []).filter((m) => !handled.has(m.cupom_entry_id))

  return (
    <Dialog open={open} onClose={linkMutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Conciliar cupons com esta fatura</DialogTitle>
      <DialogContent dividers>
        {suggestionsQ.isLoading ? (
          <LoadingState label="Procurando cupons que casam com as compras…" />
        ) : suggestionsQ.isError ? (
          <Alert severity="info">
            Não foi possível buscar sugestões de conciliação agora. Você pode fazer isso depois.
          </Alert>
        ) : matches.length === 0 ? (
          <Alert severity="success" icon={<ReceiptLongRoundedIcon />}>
            Nada a conciliar: não encontramos cupons de crédito avulsos que casem com as compras
            desta fatura.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Estas compras da fatura têm um <strong>cupom fiscal de crédito</strong> correspondente.
              Ao vincular, anexamos os itens do cupom à compra da fatura e{' '}
              <strong>removemos a despesa avulsa</strong> — evita lançamento duplicado. Nada é
              alterado sem você confirmar.
            </Typography>
            {matches.map((m) => (
              <Box
                key={m.cupom_entry_id}
                sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 2, p: 1.5 }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {m.purchase_description || 'Compra da fatura'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fatura: {formatCents(m.amount_cents)} • {formatDateBR(m.purchase_date)}
                    </Typography>
                    <Divider sx={{ my: 0.5 }} />
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      Cupom: {m.cupom_merchant || '—'} • {formatDateBR(m.cupom_date)}
                    </Typography>
                    {m.days_diff > 0 && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${m.days_diff} dia(s) de diferença`}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => setHandled((prev) => new Set(prev).add(m.cupom_entry_id))}
                      disabled={linkMutation.isPending}
                    >
                      Ignorar
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<LinkRoundedIcon />}
                      onClick={() => linkMutation.mutate(m)}
                      disabled={linkMutation.isPending}
                    >
                      Vincular
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="contained" onClick={onClose} disabled={linkMutation.isPending}>
          Concluir
        </Button>
      </DialogActions>
    </Dialog>
  )
}
