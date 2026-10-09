import { useRef } from 'react'
import { Button, Chip, Stack, Typography } from '@mui/material'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import { RECEIPT_ACCEPT } from './EntryReceiptsSection'

/**
 * Seleção de comprovantes de pagamento antes da liquidação/confirmação.
 * Só guarda os arquivos em memória; o envio acontece depois que a API
 * confirma o pagamento (ver uploadReceiptsOrThrow).
 */
export function ReceiptFilesPicker({
  files,
  onChange,
  disabled,
}: {
  files: File[]
  onChange: (next: File[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" fontWeight={600}>
          Comprovantes de pagamento (opcional)
        </Typography>
        <Button
          size="small"
          startIcon={<AttachFileRoundedIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Anexar arquivo
        </Button>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple
          accept={RECEIPT_ACCEPT}
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? [])
            if (picked.length) onChange([...files, ...picked])
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
              onDelete={disabled ? undefined : () => onChange(files.filter((_, j) => j !== i))}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
