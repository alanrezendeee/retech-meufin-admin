import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded'
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded'
import { useQuery } from '@tanstack/react-query'
import { listFiscalDocuments } from '../api'
import { financeKeys, errorMessage } from '../constants'
import { formatDateBR } from '@/utils/dates'
import { TablePaginationBR } from '@/components/tables/TablePaginationBR'
import { PageHeader } from '@/features/health/components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '@/features/health/components/StateViews'
import { ImportFiscalDialog } from '../components/ImportFiscalDialog'
import { useToast } from '@/providers/ToastProvider'

const EXTRACTION_LABEL: Record<string, string> = {
  pending: 'Aguardando leitura',
  processing: 'Lendo...',
  completed: 'Lido',
  extracted: 'Lido',
  failed: 'Falhou',
}

const EXTRACTION_COLOR: Record<string, 'default' | 'info' | 'success' | 'error'> = {
  pending: 'info',
  processing: 'info',
  completed: 'success',
  extracted: 'success',
  failed: 'error',
}

export default function CuponsPage() {
  const { show } = useToast()
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const params = useMemo(
    () => ({ limit: pageSize, offset: page * pageSize }),
    [page, pageSize]
  )

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...financeKeys.all, 'fiscal-documents', params] as const,
    queryFn: () => listFiscalDocuments(params),
  })

  const docs = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Cupons e Notas"
        subtitle="Importe cupons e notas fiscais, extraia os itens e vincule à despesa que agrupa a compra."
        action={
          <Button
            variant="contained"
            startIcon={<UploadFileRoundedIcon />}
            onClick={() => setImportOpen(true)}
          >
            Importar cupom/nota
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<ReceiptRoundedIcon />}
          title="Nenhum cupom importado"
          description="Importe um cupom fiscal ou nota fiscal (PDF ou foto) para extrair os itens comprados."
          action={
            <Button
              variant="contained"
              startIcon={<UploadFileRoundedIcon />}
              onClick={() => setImportOpen(true)}
            >
              Importar cupom/nota
            </Button>
          }
        />
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Arquivo</TableCell>
                  <TableCell>Importado em</TableCell>
                  <TableCell>Leitura</TableCell>
                  <TableCell>Vínculo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {d.original_file_name || d.file_name || '—'}
                    </TableCell>
                    <TableCell>{d.created_at ? formatDateBR(d.created_at) : '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={EXTRACTION_LABEL[d.extraction_status ?? ''] ?? d.extraction_status}
                        color={EXTRACTION_COLOR[d.extraction_status ?? ''] ?? 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {d.entry_id ? (
                        <Chip size="small" color="success" label="Vinculado a despesa" />
                      ) : (
                        <Chip size="small" variant="outlined" label="Sem vínculo" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <TablePaginationBR
            total={data?.total ?? 0}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
      )}

      {importOpen && (
        <ImportFiscalDialog
          open={importOpen}
          onClose={() => setImportOpen(false)}
          onConfirmed={(msg) => show(msg)}
        />
      )}
    </>
  )
}
