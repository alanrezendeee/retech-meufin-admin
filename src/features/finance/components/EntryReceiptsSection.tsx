import { useState } from 'react'
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { AttachFileButton } from '@/components/common/AttachFileButton'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteEntryReceipt,
  entryReceiptDownloadURL,
  listEntryReceipts,
  uploadEntryReceipt,
  type EntryReceipt,
} from '../api'
import { errorMessage, financeKeys } from '../constants'
import { ConfirmDialog } from '@/features/health/components/ConfirmDialog'
import { ErrorState, LoadingState } from '@/features/health/components/StateViews'

export const RECEIPT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.webp,.doc,.docx'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDateTimeBR(iso?: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function MimeIcon({ mime }: { mime: string }) {
  if (mime === 'application/pdf') return <PictureAsPdfRoundedIcon fontSize="small" color="error" />
  if (mime.startsWith('image/')) return <ImageRoundedIcon fontSize="small" color="primary" />
  return <DescriptionRoundedIcon fontSize="small" color="action" />
}

/**
 * Comprovantes de pagamento anexados ao lançamento: lista, abre (URL presignada
 * do MinIO, 5 min), exclui e permite anexar mais arquivos depois da liquidação.
 * Usado no detalhe do lançamento; o upload na hora de liquidar fica no
 * SettleEntryDialog.
 */
export function EntryReceiptsSection({
  entryId,
  readOnly = false,
}: {
  entryId: string
  /** Lançamento cancelado: só visualiza/baixa; não anexa nem exclui. */
  readOnly?: boolean
}) {
  const qc = useQueryClient()
  const [toDelete, setToDelete] = useState<EntryReceipt | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  const receiptsQ = useQuery({
    queryKey: financeKeys.receipts(entryId),
    queryFn: () => listEntryReceipts(entryId),
  })
  const receipts = receiptsQ.data ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: financeKeys.receipts(entryId) })

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) await uploadEntryReceipt(entryId, file)
    },
    onSettled: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (receipt: EntryReceipt) => deleteEntryReceipt(entryId, receipt.id),
    onSuccess: () => {
      setToDelete(null)
      invalidate()
    },
  })

  const openReceipt = async (receipt: EntryReceipt) => {
    setOpenError(null)
    setOpeningId(receipt.id)
    // Abre a aba antes do await: navegadores bloqueiam window.open fora do gesto do usuário.
    const tab = window.open('', '_blank')
    try {
      const url = await entryReceiptDownloadURL(entryId, receipt.id)
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
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            <TaskAltRoundedIcon fontSize="small" color="success" />
            Comprovantes de pagamento
            {receipts.length > 0 && (
              <Typography component="span" variant="caption" color="text.secondary">
                ({receipts.length})
              </Typography>
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Prova de que o pagamento foi feito — recibo, extrato, comprovante do banco.
          </Typography>
        </Box>
      </Box>
      {!readOnly && (
        <Box sx={{ mb: 1 }}>
          <AttachFileButton
            label="Anexar comprovante de pagamento"
            multiple
            accept={RECEIPT_ACCEPT}
            loading={uploadMutation.isPending}
            onFiles={(picked) => uploadMutation.mutate(picked)}
          />
        </Box>
      )}

      {receiptsQ.isLoading && <LoadingState label="Carregando comprovantes…" />}
      {receiptsQ.isError && <ErrorState message={errorMessage(receiptsQ.error)} />}
      {uploadMutation.isError && <ErrorState message={errorMessage(uploadMutation.error)} />}
      {deleteMutation.isError && <ErrorState message={errorMessage(deleteMutation.error)} />}
      {openError && <ErrorState message={openError} />}

      {receiptsQ.isSuccess && receipts.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Nenhum comprovante anexado.
        </Typography>
      )}

      {receipts.length > 0 && (
        <Stack spacing={0.5}>
          {receipts.map((r) => (
            <Box
              key={r.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <MimeIcon mime={r.mime_type} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap title={r.original_file_name}>
                  {r.original_file_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(r.size_bytes)}
                  {r.created_at ? ` · ${formatDateTimeBR(r.created_at)}` : ''}
                </Typography>
              </Box>
              <Tooltip title="Abrir / baixar">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => openReceipt(r)}
                    disabled={openingId === r.id}
                    aria-label="Abrir comprovante"
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
                    onClick={() => setToDelete(r)}
                    aria-label="Excluir comprovante"
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ))}
        </Stack>
      )}

      <ConfirmDialog
        open={toDelete != null}
        title="Excluir comprovante?"
        description={
          toDelete
            ? `"${toDelete.original_file_name}" deixará de aparecer neste lançamento.`
            : undefined
        }
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </Box>
  )
}
