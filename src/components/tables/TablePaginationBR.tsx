import { TablePagination } from '@mui/material'

/**
 * Paginação padrão do sistema (pt-BR, opções 10/20/50/100/500).
 * Server-side: passe o total do servidor e alimente limit/offset da query.
 * Client-side (cadastros pequenos já carregados): total = lista.length e
 * fatie a lista com page/pageSize.
 * Ao trocar itens/página a página volta pra 0 — e filtros novos devem
 * chamar onPageChange(0) no consumidor.
 */
export function TablePaginationBR({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  return (
    <TablePagination
      component="div"
      count={total}
      page={page}
      rowsPerPage={pageSize}
      rowsPerPageOptions={[10, 20, 50, 100, 500]}
      onPageChange={(_, p) => onPageChange(p)}
      onRowsPerPageChange={(e) => {
        onPageSizeChange(Number(e.target.value))
        onPageChange(0)
      }}
      labelRowsPerPage="Itens por página"
      labelDisplayedRows={({ from, to, count }) =>
        `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
      }
    />
  )
}
