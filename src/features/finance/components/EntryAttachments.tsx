import { useRef, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteEntryAttachment,
  entryAttachmentDownloadURL,
  listEntryAttachments,
  uploadEntryAttachment,
  type EntryAttachment,
  type EntryAttachmentType,
} from '../api'
import { ATTACHMENT_TYPE_LABEL, ATTACHMENT_TYPE_OPTIONS, errorMessage, financeKeys } from '../constants'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { ErrorState, LoadingState } from '@/features/health/components/StateViews'
import { RECEIPT_ACCEPT } from './EntryReceiptsSection'

/** Rascunho de anexo antes do upload (usado no form de criação e no diálogo de adicionar). */
export type AttachmentDraft = {
  file: File
  attachment_type: EntryAttachmentType
  payment_code: string
  note: string
}

const HAS_CODE: ReadonlySet<EntryAttachmentType> = new Set(['boleto', 'pix_qrcode'])

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Linha digitável em blocos legíveis; Pix fica como está (longo, copia inteiro). */
function displayCode(type: EntryAttachmentType | null | undefined, code: string): string {
  if (type === 'boleto' && /^\d{47}$/.test(code)) {
    return `${code.slice(0, 5)}.${code.slice(5, 10)} ${code.slice(10, 15)}.${code.slice(15, 21)} ${code.slice(21, 26)}.${code.slice(26, 32)} ${code.slice(32, 33)} ${code.slice(33)}`
  }
  if (type === 'boleto' && /^\d{48}$/.test(code)) {
    return code.match(/.{1,12}/g)?.join(' ') ?? code
  }
  return code
}

function MimeIcon({ mime }: { mime: string }) {
  if (mime === 'application/pdf') return <PictureAsPdfRoundedIcon fontSize="small" color="error" />
  if (mime.startsWith('image/')) return <ImageRoundedIcon fontSize="small" color="primary" />
  return <DescriptionRoundedIcon fontSize="small" color="action" />
}

/** Botão "copiar" com confirmação visual de 1,5s. */
export function CopyCodeButton({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard bloqueado (http sem TLS, iframe): o usuário ainda vê o código abaixo.
    }
  }
  return (
    <Tooltip title={copied ? 'Copiado!' : label}>
      <IconButton size="small" onClick={copy} aria-label={label} color={copied ? 'success' : 'default'}>
        {copied ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

/**
 * Campos de um rascunho de anexo: tipo, código de pagamento (boleto/Pix) e
 * observação. Compartilhado pelo form de criação e pelo diálogo de adicionar.
 */
function DraftFields({
  draft,
  onChange,
  autoFocusType,
}: {
  draft: AttachmentDraft
  onChange: (d: AttachmentDraft) => void
  autoFocusType?: boolean
}) {
  const showCode = HAS_CODE.has(draft.attachment_type)
  const isImage = draft.file.type.startsWith('image/')
  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label="Tipo"
        value={draft.attachment_type}
        autoFocus={autoFocusType}
        onChange={(e) =>
          onChange({ ...draft, attachment_type: e.target.value as EntryAttachmentType })
        }
      >
        {ATTACHMENT_TYPE_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
      {showCode && (
        <TextField
          size="small"
          label={draft.attachment_type === 'boleto' ? 'Linha digitável' : 'Pix copia e cola'}
          value={draft.payment_code}
          onChange={(e) => onChange({ ...draft, payment_code: e.target.value })}
          multiline={draft.attachment_type === 'pix_qrcode'}
          minRows={draft.attachment_type === 'pix_qrcode' ? 2 : 1}
          helperText={
            isImage
              ? 'Opcional: se a imagem tiver QR Code Pix, o código é lido automaticamente.'
              : 'Opcional — facilita copiar na hora de pagar.'
          }
        />
      )}
      <TextField
        size="small"
        label="Observação"
        value={draft.note}
        onChange={(e) => onChange({ ...draft, note: e.target.value })}
        inputProps={{ maxLength: 500 }}
      />
    </Stack>
  )
}

/** Sugere o tipo pelo nome do arquivo (ajuste manual sempre possível). */
function guessType(file: File): EntryAttachmentType {
  const n = file.name.toLowerCase()
  if (/boleto|cobran|fatura-?boleto/.test(n)) return 'boleto'
  if (/pix|qr/.test(n)) return 'pix_qrcode'
  if (/nf|nota|danfe|nfe|nfs/.test(n)) return 'nota_fiscal'
  if (/contrat/.test(n)) return 'contrato'
  if (/fatura|invoice/.test(n)) return 'fatura'
  return 'outro'
}

function newDraft(file: File): AttachmentDraft {
  return { file, attachment_type: guessType(file), payment_code: '', note: '' }
}

/**
 * Lista de rascunhos de anexo no form de criação da despesa: o upload só
 * acontece depois que o lançamento existe. Cada item expande tipo/código.
 */
export function AttachmentDraftList({
  drafts,
  onChange,
  disabled,
}: {
  drafts: AttachmentDraft[]
  onChange: (drafts: AttachmentDraft[]) => void
  disabled?: boolean
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="body2" fontWeight={600}>
          Anexos (boleto, QR Pix, nota…) — opcional
        </Typography>
        <Button
          size="small"
          startIcon={<AttachFileRoundedIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          Anexar arquivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept={RECEIPT_ACCEPT}
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? [])
            e.target.value = ''
            if (picked.length) onChange([...drafts, ...picked.map(newDraft)])
          }}
        />
      </Stack>
      {drafts.map((d, i) => (
        <Box
          key={`${d.file.name}-${i}`}
          sx={{ p: 1.5, borderRadius: 1.5, border: 1, borderColor: 'divider' }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <MimeIcon mime={d.file.type} />
            <Typography variant="body2" noWrap sx={{ flex: 1 }} title={d.file.name}>
              {d.file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatSize(d.file.size)}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onChange(drafts.filter((_, j) => j !== i))}
              disabled={disabled}
              aria-label="Remover anexo"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
          <DraftFields
            draft={d}
            onChange={(nd) => onChange(drafts.map((x, j) => (j === i ? nd : x)))}
          />
        </Box>
      ))}
    </Stack>
  )
}

/** Diálogo "adicionar anexo" a um lançamento existente. */
function AddAttachmentDialog({
  entryId,
  file,
  onClose,
  onDone,
}: {
  entryId: string
  file: File
  onClose: () => void
  onDone: () => void
}) {
  const [draft, setDraft] = useState<AttachmentDraft>(() => newDraft(file))
  const mutation = useMutation({
    mutationFn: () => uploadEntryAttachment(entryId, draft),
    onSuccess: onDone,
  })
  return (
    <Dialog open onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Adicionar anexo</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}
          <Stack direction="row" alignItems="center" spacing={1}>
            <MimeIcon mime={file.type} />
            <Typography variant="body2" noWrap title={file.name}>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatSize(file.size)}
            </Typography>
          </Stack>
          <DraftFields draft={draft} onChange={setDraft} autoFocusType />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button onClick={() => mutation.mutate()} variant="contained" disabled={mutation.isPending}>
          {mutation.isPending ? 'Enviando…' : 'Anexar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * Anexos de apoio do lançamento (boleto, QR Code Pix, nota, contrato…):
 * lista com código de pagamento copiável, abre via URL presignada, exclui
 * e adiciona. Distinto dos comprovantes (que provam o pagamento).
 */
export function EntryAttachmentsSection({
  entryId,
  readOnly = false,
}: {
  entryId: string
  readOnly?: boolean
}) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState<File | null>(null)
  const [toDelete, setToDelete] = useState<EntryAttachment | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  const attachmentsQ = useQuery({
    queryKey: financeKeys.attachments(entryId),
    queryFn: () => listEntryAttachments(entryId),
  })
  const attachments = attachmentsQ.data ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: financeKeys.attachments(entryId) })

  const deleteMutation = useMutation({
    mutationFn: (a: EntryAttachment) => deleteEntryAttachment(entryId, a.id),
    onSuccess: () => {
      setToDelete(null)
      invalidate()
    },
  })

  const openAttachment = async (a: EntryAttachment) => {
    setOpenError(null)
    setOpeningId(a.id)
    const tab = window.open('', '_blank')
    try {
      const url = await entryAttachmentDownloadURL(entryId, a.id)
      if (tab) tab.location.href = url
      else window.location.href = url
    } catch (err) {
      tab?.close()
      setOpenError(errorMessage(err))
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Anexos
          {attachments.length > 0 && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
              ({attachments.length})
            </Typography>
          )}
        </Typography>
        {!readOnly && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AttachFileRoundedIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              Anexar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept={RECEIPT_ACCEPT}
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null
                e.target.value = ''
                if (picked) setAdding(picked)
              }}
            />
          </>
        )}
      </Box>

      {attachmentsQ.isLoading && <LoadingState label="Carregando anexos…" />}
      {attachmentsQ.isError && <ErrorState message={errorMessage(attachmentsQ.error)} />}
      {deleteMutation.isError && <ErrorState message={errorMessage(deleteMutation.error)} />}
      {openError && <ErrorState message={openError} />}

      {attachmentsQ.isSuccess && attachments.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nenhum anexo. Boleto, QR Code Pix, nota ou contrato ficam aqui para consulta.
        </Typography>
      )}

      {attachments.length > 0 && (
        <Stack spacing={0.75}>
          {attachments.map((a) => (
            <Box
              key={a.id}
              sx={{ px: 1, py: 0.75, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MimeIcon mime={a.mime_type} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={a.attachment_type === 'pix_qrcode' ? <QrCode2RoundedIcon /> : undefined}
                      label={ATTACHMENT_TYPE_LABEL[a.attachment_type ?? 'outro'] ?? a.attachment_type}
                    />
                    <Typography variant="body2" noWrap title={a.original_file_name}>
                      {a.original_file_name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatSize(a.size_bytes)}
                    {a.note ? ` · ${a.note}` : ''}
                  </Typography>
                </Box>
                <Tooltip title="Abrir / baixar">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => openAttachment(a)}
                      disabled={openingId === a.id}
                      aria-label="Abrir anexo"
                    >
                      <DownloadRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                {!readOnly && (
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setToDelete(a)}
                      aria-label="Excluir anexo"
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {a.payment_code && (
                <Box
                  sx={{
                    mt: 0.75,
                    ml: 3.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'action.selected',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1,
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      userSelect: 'all',
                    }}
                  >
                    {displayCode(a.attachment_type, a.payment_code)}
                  </Typography>
                  <CopyCodeButton
                    code={a.payment_code}
                    label={a.attachment_type === 'boleto' ? 'Copiar linha digitável' : 'Copiar código Pix'}
                  />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {adding && (
        <AddAttachmentDialog
          entryId={entryId}
          file={adding}
          onClose={() => setAdding(null)}
          onDone={() => {
            setAdding(null)
            invalidate()
          }}
        />
      )}

      <ConfirmDialog
        open={toDelete != null}
        title="Excluir anexo?"
        description={
          toDelete ? `"${toDelete.original_file_name}" deixará de aparecer neste lançamento.` : undefined
        }
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </Box>
  )
}
