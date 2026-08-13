import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FolderSharedRoundedIcon from '@mui/icons-material/FolderSharedRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteDocument,
  getDocumentDownloadUrl,
  listDocumentsPaged,
  listFamilyMembers,
  uploadDocument,
  type HealthDocument,
} from '../api'
import { errorMessage, healthKeys } from '../constants'
import { PageHeader } from '../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TablePaginationBR } from '@/components/tables/TablePaginationBR'
import { useToast } from '@/providers/ToastProvider'
import { formatDateTimeBR } from '@/utils/dates'

// Tipos VÁLIDOS no backend (dom.ValidDocumentType) — chave fora da lista
// derruba o upload com "document_type inválido".
const DOC_TYPE_LABEL: Record<string, string> = {
  exam_result: 'Resultado de exame',
  exam_request: 'Solicitação',
  image_report: 'Exame de imagem',
  medical_report: 'Laudo médico',
  prescription: 'Receita',
  other: 'Outro',
}

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABEL).map(([value, label]) => ({ value, label }))

function docTypeLabel(t: string): string {
  return DOC_TYPE_LABEL[t] ?? t
}

function formatSize(bytes?: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Documentos de saúde: tudo que foi enviado (laudos, radiografias, PDFs),
 * com filtros por membro/tipo, visualização (URL temporária) e upload direto
 * (sem extração — para anexos como imagens de ressonância/radiografia).
 */
export default function HealthDocumentsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [memberId, setMemberId] = useState('')
  const [docType, setDocType] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [toDelete, setToDelete] = useState<HealthDocument | null>(null)
  const [uploadType, setUploadType] = useState('image_report')
  const fileInput = useRef<HTMLInputElement>(null)

  const { data: members = [] } = useQuery({
    queryKey: healthKeys.familyMembers(),
    queryFn: listFamilyMembers,
  })

  const params = useMemo(
    () => ({
      family_member_id: memberId || undefined,
      document_type: docType || undefined,
      limit: pageSize,
      offset: page * pageSize,
    }),
    [memberId, docType, page, pageSize]
  )
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...healthKeys.documents(), 'page', params] as const,
    queryFn: () => listDocumentsPaged(params),
  })
  const docs = data?.items ?? []

  const memberName = (id?: string | null) =>
    members.find((m) => m.id === id)?.full_name ?? '—'

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      form.append('document_type', uploadType)
      if (memberId) form.append('family_member_id', memberId)
      return uploadDocument(form)
    },
    onSuccess: () => {
      show('Documento enviado.')
      qc.invalidateQueries({ queryKey: healthKeys.documents() })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      show('Documento excluído.')
      setToDelete(null)
      qc.invalidateQueries({ queryKey: healthKeys.documents() })
    },
  })

  const view = async (doc: HealthDocument) => {
    const { url } = await getDocumentDownloadUrl(doc.id)
    window.open(url, '_blank', 'noopener')
  }

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Laudos, radiografias e arquivos de saúde enviados — visualize, organize e anexe aos exames."
      />

      <Card sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <TextField
            select
            size="small"
            label="Membro"
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {members.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.full_name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Tipo"
            value={docType}
            onChange={(e) => {
              setDocType(e.target.value)
              setPage(0)
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">
              <em>Todos</em>
            </MenuItem>
            {DOC_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <TextField
            select
            size="small"
            label="Tipo do upload"
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {DOC_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={<UploadFileRoundedIcon />}
            disabled={uploadMutation.isPending}
            onClick={() => fileInput.current?.click()}
          >
            Enviar arquivo
          </Button>
          <input
            ref={fileInput}
            type="file"
            hidden
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) uploadMutation.mutate(f)
              e.target.value = ''
            }}
          />
        </Stack>
        {uploadMutation.isError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {errorMessage(uploadMutation.error)}
          </Alert>
        )}
        {memberId === '' && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Dica: selecione um membro antes de enviar para o arquivo já ficar vinculado a ele.
          </Typography>
        )}
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FolderSharedRoundedIcon />}
          title="Nenhum documento"
          description="Envie laudos e imagens de exames, ou importe um exame por PDF — os arquivos aparecem aqui."
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Arquivo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Membro</TableCell>
                  <TableCell>Vínculo</TableCell>
                  <TableCell>Tamanho</TableCell>
                  <TableCell>Enviado em</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontWeight: 600, maxWidth: 280 }}>
                      <Typography variant="body2" noWrap title={d.original_file_name ?? ''}>
                        {d.original_file_name || d.file_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={docTypeLabel(d.document_type)} />
                    </TableCell>
                    <TableCell>{memberName(d.family_member_id)}</TableCell>
                    <TableCell>
                      {d.exam_result_id ? (
                        <Chip size="small" color="success" variant="outlined" label="anexado a exame" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{formatSize(d.size_bytes)}</TableCell>
                    <TableCell>{formatDateTimeBR(d.created_at)}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Visualizar / baixar">
                        <IconButton size="small" onClick={() => view(d)}>
                          <OpenInNewRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => setToDelete(d)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePaginationBR
            total={data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir documento"
        description={`Tem certeza que deseja excluir "${toDelete?.original_file_name ?? 'este documento'}"? O arquivo será removido do armazenamento.`}
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  )
}
