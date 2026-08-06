import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { renameInstallmentGroup, type InstallmentGroup } from '../api'
import { errorMessage, financeKeys } from '../constants'
import { ErrorState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

/**
 * Renomeia o parcelamento inteiro.
 *
 * Alcança as parcelas já pagas de propósito: descrição é rótulo da dívida, não
 * valor. Renomear só as futuras — que é o que a edição por lançamento faz —
 * deixaria a mesma dívida com dois nomes no histórico.
 */
export function RenameInstallmentGroupDialog({
  group,
  onClose,
}: {
  group: InstallmentGroup
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const [description, setDescription] = useState(group.description)

  const trimmed = description.trim()
  const unchanged = trimmed === group.description.trim()

  const mutation = useMutation({
    mutationFn: () => renameInstallmentGroup(group.group_id as string, trimmed),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      show(
        res.residuals_updated > 0
          ? `Parcelamento renomeado em ${res.entries_updated} lançamentos e ${res.residuals_updated} residuais.`
          : `Parcelamento renomeado em ${res.entries_updated} lançamentos.`
      )
      onClose()
    },
  })

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Renomear parcelamento</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            autoFocus
          />

          <Alert severity="info" sx={{ py: 0.5 }}>
            O novo nome vale para as <strong>{group.installment_total} parcelas</strong> —
            inclusive as {group.last_known_number} já pagas — e para os residuais de pagamentos
            parciais. Só o nome muda; valores, vencimentos e status ficam como estão.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={!trimmed || unchanged || mutation.isPending}
        >
          Renomear
        </Button>
      </DialogActions>
    </Dialog>
  )
}
