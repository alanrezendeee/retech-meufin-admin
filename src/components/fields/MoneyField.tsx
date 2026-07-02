import { forwardRef } from 'react'
import { TextField, InputAdornment, type TextFieldProps } from '@mui/material'

/**
 * Formata a digitação como moeda pt-BR "de trás pra frente": o usuário digita
 * só números e os centavos entram primeiro (1 → 0,01; 1234 → 12,34).
 * Vírgula/ponto digitados são ignorados — a máscara é quem pontua.
 */
function formatMoneyTyping(raw: string): string {
  // Tudo que não for dígito sai; zeros à esquerda caem; cap de 13 dígitos
  // (R$ 99 bilhões) mantém a conta dentro do inteiro seguro do JS.
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 13)
  if (!digits) return ''
  const cents = Number(digits)
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Campo de dinheiro com máscara automática. Mantém o contrato dos formulários
 * existentes: o value continua sendo a string pt-BR ("1.234,56") que o
 * reaisToCents já converte para centavos no submit — troca de TextField por
 * MoneyField não muda nenhuma lógica de form.
 */
export const MoneyField = forwardRef<HTMLDivElement, TextFieldProps>(function MoneyField(
  { onChange, value, InputProps, inputProps, ...rest },
  ref
) {
  return (
    <TextField
      {...rest}
      ref={ref}
      value={formatMoneyTyping(String(value ?? ''))}
      onChange={(e) => {
        e.target.value = formatMoneyTyping(e.target.value)
        onChange?.(e)
      }}
      placeholder="0,00"
      InputProps={{
        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
        ...InputProps,
      }}
      inputProps={{ inputMode: 'numeric', ...inputProps }}
    />
  )
})
