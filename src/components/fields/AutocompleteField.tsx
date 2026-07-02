import { Autocomplete, TextField, Typography, Stack } from '@mui/material'

export type AutocompleteOption = {
  value: string
  label: string
  /** Linha secundária exibida na lista (ex.: exemplos do grupo) — também pesquisável. */
  description?: string
  /** Termos extras pesquisáveis que não aparecem na UI. */
  keywords?: string
}

/** Busca acento-insensível e case-insensível. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Autocomplete padrão do sistema para listas de entidades (categorias, grupos,
 * fontes, membros, cartões...). A busca casa nome, descrição E keywords —
 * digitar "cinema" acha o grupo "Lazer & Cultura" pelos exemplos. Fechado,
 * mostra só o label (nada de descrição empilhada). Para enums minúsculos
 * (status, recorrência), continue com select nativo.
 */
export function AutocompleteField({
  options,
  value,
  onChange,
  label,
  placeholder,
  emptyLabel,
  size,
  required,
  fullWidth = true,
  disabled,
  error,
  helperText,
  sx,
}: {
  options: AutocompleteOption[]
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  /** Se definido, inclui a opção "vazio" (value '') com esse rótulo — ex.: "Não atribuída". */
  emptyLabel?: string
  size?: 'small' | 'medium'
  required?: boolean
  fullWidth?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
  sx?: object
}) {
  const all: AutocompleteOption[] = emptyLabel
    ? [{ value: '', label: emptyLabel }, ...options]
    : options

  const selected = all.find((o) => o.value === value) ?? null

  return (
    <Autocomplete
      options={all}
      value={selected}
      onChange={(_, opt) => onChange(opt?.value ?? '')}
      getOptionLabel={(o) => o.label}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      disabled={disabled}
      size={size}
      fullWidth={fullWidth}
      sx={sx}
      noOptionsText="Nada encontrado"
      filterOptions={(opts, state) => {
        const q = normalize(state.inputValue.trim())
        if (!q) return opts
        return opts.filter((o) =>
          normalize(`${o.label} ${o.description ?? ''} ${o.keywords ?? ''}`).includes(q)
        )
      }}
      renderOption={(props, o) => (
        <li {...props} key={o.value}>
          <Stack sx={{ py: 0.25 }}>
            <span>{o.label}</span>
            {o.description && (
              <Typography variant="caption" color="text.secondary">
                {o.description}
              </Typography>
            )}
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
        />
      )}
    />
  )
}
