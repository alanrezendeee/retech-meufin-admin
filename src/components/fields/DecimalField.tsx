import { forwardRef } from 'react'
import { TextField, InputAdornment, type TextFieldProps } from '@mui/material'

/**
 * Formata a digitação como decimal pt-BR "de trás pra frente", no mesmo
 * espírito do MoneyField: o usuário digita só números e as casas decimais
 * entram primeiro (com decimals=2: "1" → "0,01"; "178" → "1,78";
 * com decimals=1: "725" → "72,5"). Vírgula/ponto digitados são ignorados —
 * a máscara é quem pontua.
 */
function formatDecimalTyping(raw: string, decimals: number): string {
  // Tudo que não for dígito sai; zeros à esquerda caem; cap de 9 dígitos
  // mantém o valor dentro de qualquer medida realista.
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9)
  if (!digits) return ''
  const value = Number(digits) / 10 ** decimals
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** "1,78" (pt-BR, saída do DecimalField) → 1.78. Vazio/inválido → null. */
export function parseDecimalBR(value: string | null | undefined): number | null {
  if (!value) return null
  const n = Number(String(value).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** 1.78 → "1,78" com as casas pedidas, para carregar valores no form. */
export function formatDecimalBR(value: number | null | undefined, decimals: number): string {
  if (value == null || !Number.isFinite(value)) return ''
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export type DecimalFieldProps = TextFieldProps & {
  /** Casas decimais da máscara (ex.: 1 para peso em kg, 2 para altura em m). */
  decimals: number
  /** Sufixo de unidade exibido no campo (ex.: "kg", "m"). */
  unit?: string
}

/**
 * Campo numérico decimal com máscara automática pt-BR e casas configuráveis.
 * O value trafega como string pt-BR ("72,5") — use parseDecimalBR no submit
 * e formatDecimalBR ao carregar o form.
 */
export const DecimalField = forwardRef<HTMLDivElement, DecimalFieldProps>(function DecimalField(
  { decimals, unit, onChange, value, InputProps, inputProps, placeholder, ...rest },
  ref
) {
  return (
    <TextField
      {...rest}
      ref={ref}
      value={formatDecimalTyping(String(value ?? ''), decimals)}
      onChange={(e) => {
        e.target.value = formatDecimalTyping(e.target.value, decimals)
        onChange?.(e)
      }}
      placeholder={placeholder ?? (0).toLocaleString('pt-BR', { minimumFractionDigits: decimals })}
      InputProps={{
        ...(unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : null),
        ...InputProps,
      }}
      inputProps={{ inputMode: 'numeric', ...inputProps }}
    />
  )
})
