import jsQR from 'jsqr'

/**
 * Decodifica o QR Code de uma imagem de cupom fiscal no NAVEGADOR (client-side).
 * Retorna o conteúdo do QR — a URL da SEFAZ que contém a chave de acesso + hash —
 * ou null quando não encontra um QR legível.
 *
 * Só serve para obter o código; a validação em si acontece no backend (SEFAZ).
 * Tenta em algumas escalas porque o QR costuma ser pequeno numa foto grande.
 */
export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null
  const img = await loadImage(file)
  try {
    for (const maxDim of [1600, 1000, 2400]) {
      const data = decodeAtScale(img, maxDim)
      if (data) return data
    }
    return null
  } finally {
    // Libera memória do bitmap decodificado.
    if (typeof (img as ImageBitmap).close === 'function') {
      ;(img as ImageBitmap).close()
    }
  }
}

type Drawable = HTMLImageElement | ImageBitmap

function loadImage(file: File): Promise<Drawable> {
  // createImageBitmap respeita a orientação EXIF e é rápido; cai para <img>.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaElement(file))
  }
  return loadViaElement(file)
}

function loadViaElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function decodeAtScale(img: Drawable, maxDim: number): string | null {
  const iw = (img as HTMLImageElement).naturalWidth || (img as ImageBitmap).width
  const ih = (img as HTMLImageElement).naturalHeight || (img as ImageBitmap).height
  if (!iw || !ih) return null

  const scale = Math.min(1, maxDim / Math.max(iw, ih))
  const w = Math.max(1, Math.round(iw * scale))
  const h = Math.max(1, Math.round(ih * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' })
  const data = code?.data?.trim()
  return data ? data : null
}
