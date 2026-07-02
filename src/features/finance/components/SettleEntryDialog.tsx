import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  centsToReais,
  formatCents,
  listAccounts,
  listCards,
  reaisToCents,
  settleEntry,
  uploadEntryReceipt,
  type Entry,
  type PaymentMethod,
} from '../api'
import {
  ACCOUNT_PAYMENT_METHODS,
  errorMessage,
  financeKeys,
  PAYMENT_METHOD_OPTIONS,
} from '../constants'
import { MoneyField } from '@/components/fields/MoneyField'
import { ErrorState } from '@/features/health/components/StateViews'

type FormValues = {
  paid_at: string // YYYY-MM-DD
  paid_amount: string // em reais (texto)
  payment_method: PaymentMethod
  account_id: string
  card_id: string
  notes: string
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Liquidação de um lançamento (pagar despesa / receber receita) com forma de
 * pagamento e comprovantes opcionais. Fatura pai cascateia para os filhos.
 */
export function SettleEntryDialog({
  entry,
  onClose,
  onSettled,
}: {
  entry: Entry
  onClose: () => void
  onSettled?: () => void
}) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const isExpense = entry.kind === 'debit'

  const { data: accounts } = useQuery({ queryKey: financeKeys.accounts(), queryFn: listAccounts })
  const { data: cards } = useQuery({ queryKey: financeKeys.cards(), queryFn: listCards })

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      paid_at: todayISO(),
      paid_amount: centsToReais(entry.amount_cents).toFixed(2).replace('.', ','),
      payment_method: 'pix',
      account_id: '',
      card_id: entry.card_id ?? '',
      notes: '',
    },
  })

  const method = useWatch({ control, name: 'payment_method' })
  const paidAmountText = useWatch({ control, name: 'paid_amount' })
  const needsAccount = (ACCOUNT_PAYMENT_METHODS as readonly string[]).includes(method)
  const needsCard = method === 'cartao_credito'

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const settled = await settleEntry(entry.id, {
        paid_at: values.paid_at || null,
        paid_amount_cents: reaisToCents(values.paid_amount),
        payment_method: values.payment_method,
        account_id: needsAccount && values.account_id ? values.account_id : null,
        card_id: needsCard && values.card_id ? values.card_id : null,
        notes: values.notes.trim() || null,
      })
      for (const file of files) {
        await uploadEntryReceipt(entry.id, file)
      }
      return settled
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all })
      onSettled?.()
      onClose()
    },
  })

  const paidDiffers = useMemo(() => {
    const typed = reaisToCents(paidAmountText)
    return typed > 0 && typed !== entry.amount_cents
  }, [paidAmountText, entry.amount_cents])

  const submit = handleSubmit((values) => {
    if (needsCard && !values.card_id) return
    mutation.mutate(values)
  })

  const isParentInvoice = (entry.type as string | null) === 'cartao' && !entry.parent_id

  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isExpense ? 'Pagar lançamento' : 'Receber lançamento'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {entry.description || 'Sem descrição'}
            </Typography>
            <Typography variant="subtitle1" fontWeight={800}>
              {formatCents(entry.amount_cents)}
            </Typography>
          </Stack>

          {isParentInvoice && (
            <Alert severity="info">
              Esta é uma fatura de cartão: ao liquidar, todas as compras dentro dela também são
              marcadas como realizadas.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Controller
              name="paid_at"
              control={control}
              rules={{ required: 'Informe a data do pagamento' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label={isExpense ? 'Pago em' : 'Recebido em'}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  error={Boolean(errors.paid_at)}
                  helperText={errors.paid_at?.message}
                />
              )}
            />
            <Controller
              name="paid_amount"
              control={control}
              rules={{
                required: 'Informe o valor',
                validate: (v) => reaisToCents(v) !== 0 || 'Valor não pode ser zero',
              }}
              render={({ field }) => (
                <MoneyField
                  {...field}
                  label={isExpense ? 'Valor pago' : 'Valor recebido'}
                  fullWidth
                  required
                  error={Boolean(errors.paid_amount)}
                  helperText={
                    errors.paid_amount?.message ??
                    (paidDiffers ? 'Difere do previsto (juros, multa ou desconto)' : undefined)
                  }
                />
              )}
            />
          </Stack>

          <Controller
            name="payment_method"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <TextField {...field} select label="Forma de pagamento" fullWidth required>
                {PAYMENT_METHOD_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {needsAccount && (
            <Controller
              name="account_id"
              control={control}
              render={({ field }) => (
                <TextField {...field} select label="Conta" fullWidth>
                  <MenuItem value="">
                    <em>Não informar</em>
                  </MenuItem>
                  {(accounts ?? [])
                    .filter((a) => a.active)
                    .map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.name}
                        {a.bank_name ? ` — ${a.bank_name}` : ''}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
          )}

          {needsCard && (
            <Controller
              name="card_id"
              control={control}
              rules={{ required: 'Informe o cartão usado' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Cartão de crédito"
                  fullWidth
                  required
                  error={Boolean(errors.card_id)}
                  helperText={
                    errors.card_id?.message ??
                    'A compra entra na próxima fatura do cartão — registre-a lá também.'
                  }
                >
                  {(cards ?? [])
                    .filter((c) => c.active)
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
          )}

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Observações" fullWidth multiline minRows={2} />
            )}
          />

          <Divider />

          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>
                Comprovantes (opcional)
              </Typography>
              <Button
                size="small"
                startIcon={<AttachFileRoundedIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Anexar arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,.doc,.docx"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? [])
                  if (picked.length) setFiles((prev) => [...prev, ...picked])
                  e.target.value = ''
                }}
              />
            </Stack>
            {files.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {files.map((f, i) => (
                  <Chip
                    key={`${f.name}-${i}`}
                    label={f.name}
                    size="small"
                    onDelete={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button onClick={submit} variant="contained" disabled={mutation.isPending}>
          {mutation.isPending ? 'Liquidando…' : isExpense ? 'Confirmar pagamento' : 'Confirmar recebimento'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
