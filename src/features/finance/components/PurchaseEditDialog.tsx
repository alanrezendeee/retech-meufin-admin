import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reaisToCents, updateEntry, type Entry, type EntryInput } from '../api'
import { errorMessage, financeKeys } from '../constants'
import { MoneyField } from '@/components/fields/MoneyField'
import { AutocompleteField } from '@/components/fields/AutocompleteField'
import { useExpenseCategories } from '../hooks/useExpenseCategories'
import { ErrorState } from '@/features/health/components/StateViews'
import { useToast } from '@/providers/ToastProvider'

/**
 * Edição de uma compra dentro de fatura (lançamento filho): descrição,
 * categoria, valor e data da compra. O vencimento continua sendo o da fatura
 * e não é editável aqui.
 */
export function PurchaseEditDialog({
  purchase,
  onClose,
}: {
  purchase: Entry
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { show } = useToast()
  const { activeCategories } = useExpenseCategories()

  const [description, setDescription] = useState(purchase.description)
  const [amountText, setAmountText] = useState(
    (purchase.amount_cents / 100).toFixed(2).replace('.', ','),
  )
  const [category, setCategory] = useState((purchase.type as string | null) ?? '')
  const [purchaseDate, setPurchaseDate] = useState(purchase.purchase_date ?? '')
  const [installmentNumber, setInstallmentNumber] = useState(
    purchase.installment_number != null ? String(purchase.installment_number) : '',
  )
  const [installmentTotal, setInstallmentTotal] = useState(
    purchase.installment_total != null ? String(purchase.installment_total) : '',
  )

  const amountCents = reaisToCents(amountText)
  const instNumber = installmentNumber ? Math.trunc(Number(installmentNumber)) : 0
  const instTotal = installmentTotal ? Math.trunc(Number(installmentTotal)) : 0
  const installmentsInvalid = instNumber > 0 && instTotal > 0 && instNumber > instTotal
  const invalid = !description.trim() || amountCents <= 0 || installmentsInvalid

  const mutation = useMutation({
    mutationFn: () => {
      const input: EntryInput = {
        kind: 'debit',
        status: purchase.status,
        amount_cents: amountCents,
        due_date: purchase.due_date,
        family_member_id: purchase.family_member_id ?? null,
        source_id: null,
        type: (category || null) as EntryInput['type'],
        description: description.trim(),
        recurrence: 'none',
        notes: purchase.notes ?? null,
        supplier_id: purchase.supplier_id ?? null,
        purchase_date: purchaseDate || null,
        // 0 = limpar parcela no backend (campo vazio)
        installment_number: instNumber,
        installment_total: instTotal,
      }
      return updateEntry(purchase.id, input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      show('Compra atualizada.')
      onClose()
    },
  })

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Editar compra</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            required
            error={!description.trim()}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <MoneyField
              label="Valor"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              fullWidth
              required
              error={amountCents <= 0}
            />
            <TextField
              type="date"
              label="Data da compra"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <AutocompleteField
            label="Categoria"
            value={category}
            onChange={setCategory}
            options={activeCategories.map((c) => ({ value: c.slug, label: c.name }))}
            placeholder="Busque pela categoria"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              label="Parcela nº"
              value={installmentNumber}
              onChange={(e) => setInstallmentNumber(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
              error={installmentsInvalid}
            />
            <TextField
              type="number"
              label="de (total)"
              value={installmentTotal}
              onChange={(e) => setInstallmentTotal(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
              error={installmentsInvalid}
              helperText={
                installmentsInvalid
                  ? 'Nº maior que o total'
                  : 'Vazio = compra não parcelada'
              }
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || invalid}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
