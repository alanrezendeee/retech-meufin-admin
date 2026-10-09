import { useRef } from 'react'
import { Button, alpha } from '@mui/material'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'

/**
 * Botão padrão de anexar arquivo: ocupa a largura toda, clipe + rótulo.
 * Tema claro: fundo verde (primary) com texto escuro. Tema escuro: inverte —
 * fundo escuro com texto e borda em verde. Encapsula o <input type="file">.
 */
export function AttachFileButton({
  label = 'Anexar arquivo',
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  loading = false,
  loadingLabel = 'Enviando…',
  fullWidth = true,
}: {
  label?: string
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
  /** false em toolbars, onde o botão convive com outros controles na mesma linha. */
  fullWidth?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <Button
        fullWidth={fullWidth}
        variant="text"
        startIcon={<AttachFileRoundedIcon />}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        sx={(theme) => {
          const green = theme.palette.primary.main
          const dark = theme.palette.mode === 'dark'
          return {
            justifyContent: 'center',
            py: 1,
            textTransform: 'none',
            bgcolor: dark ? alpha(theme.palette.common.black, 0.55) : green,
            color: dark ? green : theme.palette.primary.contrastText,
            border: `1px solid ${dark ? alpha(green, 0.6) : 'transparent'}`,
            '&:hover': {
              bgcolor: dark ? alpha(green, 0.14) : theme.palette.primary.dark,
              borderColor: dark ? green : 'transparent',
            },
            '&.Mui-disabled': {
              bgcolor: dark ? alpha(theme.palette.common.black, 0.35) : alpha(green, 0.45),
              color: dark ? alpha(green, 0.5) : alpha(theme.palette.primary.contrastText, 0.6),
              borderColor: dark ? alpha(green, 0.25) : 'transparent',
            },
          }
        }}
      >
        {loading ? loadingLabel : label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (picked.length) onFiles(picked)
        }}
      />
    </>
  )
}
