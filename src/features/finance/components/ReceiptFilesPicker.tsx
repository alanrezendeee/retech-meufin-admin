import { Chip, Stack } from '@mui/material'
import { AttachFileButton } from '@/components/common/AttachFileButton'
import { RECEIPT_ACCEPT } from './EntryReceiptsSection'

/**
 * Seleção de comprovantes de pagamento antes da liquidação/confirmação.
 * Botão padrão (AttachFileButton) + chips dos arquivos escolhidos.
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
  return (
    <Stack spacing={1}>
      <AttachFileButton
        label="Anexar comprovante de pagamento"
        multiple
        accept={RECEIPT_ACCEPT}
        disabled={disabled}
        onFiles={(picked) => onChange([...files, ...picked])}
      />
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
