import { uploadEntryReceipt } from './api'
import { errorMessage } from './constants'

/**
 * Envia os comprovantes um a um. Se algum falhar, chama onFailed com os
 * arquivos restantes (para retry) e lança erro com o detalhe — o pagamento
 * já foi gravado e NÃO deve ser repetido.
 */
export async function uploadReceiptsOrThrow(
  entryId: string,
  files: File[],
  onFailed: (remaining: File[]) => void
): Promise<void> {
  const failed: { file: File; reason: string }[] = []
  for (const file of files) {
    try {
      await uploadEntryReceipt(entryId, file)
    } catch (err) {
      failed.push({ file, reason: errorMessage(err) })
    }
  }
  if (failed.length > 0) {
    onFailed(failed.map((f) => f.file))
    const detail = failed.map((f) => `${f.file.name}: ${f.reason}`).join('; ')
    throw new Error(
      `Pagamento registrado, mas ${failed.length} comprovante(s) não foram enviados (${detail}). ` +
        'Tente novamente ou anexe depois pelo detalhe do lançamento.'
    )
  }
}
