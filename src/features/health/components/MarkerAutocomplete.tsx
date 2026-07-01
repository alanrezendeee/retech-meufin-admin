import { useMemo, useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { listMarkers, type Marker } from '../api'
import { healthKeys } from '../constants'

/**
 * Busca de marcador no catálogo. Retorna o Marker selecionado (ou null).
 * Debounce simples via estado de input; a busca só dispara com 2+ chars.
 */
export function MarkerAutocomplete({
  value,
  onChange,
  label = 'Marcador (catálogo)',
  size = 'small',
}: {
  value: Marker | null
  onChange: (marker: Marker | null) => void
  label?: string
  size?: 'small' | 'medium'
}) {
  const [input, setInput] = useState('')
  const query = input.trim()
  const enabled = query.length >= 2

  const params = useMemo(() => ({ query, limit: 20, offset: 0 }), [query])

  const { data, isFetching } = useQuery({
    queryKey: healthKeys.markers(params),
    queryFn: () => listMarkers(params),
    enabled,
  })

  const options = data?.items ?? []

  return (
    <Autocomplete<Marker>
      value={value}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v) => setInput(v)}
      options={options}
      loading={isFetching}
      getOptionLabel={(o) =>
        o.canonical_unit ? `${o.canonical_name} (${o.canonical_unit})` : o.canonical_name
      }
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(x) => x}
      noOptionsText={enabled ? 'Nenhum marcador encontrado' : 'Digite ao menos 2 caracteres'}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size={size}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isFetching ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
