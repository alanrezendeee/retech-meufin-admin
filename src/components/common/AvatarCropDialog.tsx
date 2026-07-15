import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from '@mui/material'
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded'

/** Diâmetro do círculo de pré-visualização (px). */
const PREVIEW = 280
/** Lado da imagem exportada (px). */
const EXPORT = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 4

export type AvatarCropDialogProps = {
  open: boolean
  imageFile: File | null
  onClose: () => void
  /** Recebe o recorte final como Blob JPEG (qualidade 0.9). */
  onApply: (blob: Blob) => void
}

type Geometry = {
  /** posição do canto superior-esquerdo da imagem no espaço do preview */
  dx: number
  dy: number
  /** tamanho renderizado da imagem no espaço do preview */
  w: number
  h: number
}

/**
 * Diálogo reutilizável de recorte de foto (avatar). Canvas puro, sem dependências.
 * A imagem pode ser arrastada (pointer) e ajustada por sliders (zoom/horizontal/vertical).
 * Ao aplicar, exporta o quadrado do enquadramento como JPEG 512×512.
 */
export function AvatarCropDialog({ open, imageFile, onClose, onApply }: AvatarCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  // pan normalizado em [-1, 1] por eixo (independe do zoom).
  const [nx, setNx] = useState(0)
  const [ny, setNy] = useState(0)

  // Carrega a imagem selecionada (object URL revogado ao trocar/fechar).
  useEffect(() => {
    if (!open || !imageFile) {
      imgRef.current = null
      setDims(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setDims({ w: img.naturalWidth, h: img.naturalHeight })
      setZoom(1)
      setNx(0)
      setNy(0)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [open, imageFile])

  // Geometria atual da imagem no espaço do preview (escala "cover" × zoom).
  const geometry = useCallback((): Geometry | null => {
    if (!dims) return null
    const base = PREVIEW / Math.min(dims.w, dims.h) // cobre o círculo em zoom 1
    const scale = base * zoom
    const w = dims.w * scale
    const h = dims.h * scale
    const maxX = (w - PREVIEW) / 2
    const maxY = (h - PREVIEW) / 2
    const offX = nx * maxX
    const offY = ny * maxY
    return { dx: (PREVIEW - w) / 2 + offX, dy: (PREVIEW - h) / 2 + offY, w, h }
  }, [dims, zoom, nx, ny])

  // Redesenha o preview (imagem + máscara circular) a cada mudança.
  useEffect(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    const g = geometry()
    if (!canvas || !img || !g) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, PREVIEW, PREVIEW)
    ctx.drawImage(img, g.dx, g.dy, g.w, g.h)

    // Escurece a área fora do círculo (retângulo cheio menos o círculo, even-odd).
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, PREVIEW, PREVIEW)
    ctx.arc(PREVIEW / 2, PREVIEW / 2, PREVIEW / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fill('evenodd')
    ctx.restore()

    // Borda do círculo.
    ctx.beginPath()
    ctx.arc(PREVIEW / 2, PREVIEW / 2, PREVIEW / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [geometry])

  // Arraste da imagem via pointer events.
  const drag = useRef<{ x: number; y: number } | null>(null)

  const maxPan = useCallback(() => {
    if (!dims) return { maxX: 0, maxY: 0 }
    const base = PREVIEW / Math.min(dims.w, dims.h)
    const scale = base * zoom
    return { maxX: (dims.w * scale - PREVIEW) / 2, maxY: (dims.h * scale - PREVIEW) / 2 }
  }, [dims, zoom])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dims) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return
    const { maxX, maxY } = maxPan()
    const dxPx = e.clientX - drag.current.x
    const dyPx = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    if (maxX > 0) setNx((v) => clamp(v + dxPx / maxX, -1, 1))
    if (maxY > 0) setNy((v) => clamp(v + dyPx / maxY, -1, 1))
  }
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }

  const handleApply = () => {
    const img = imgRef.current
    const g = geometry()
    if (!img || !g) return
    const out = document.createElement('canvas')
    out.width = EXPORT
    out.height = EXPORT
    const ctx = out.getContext('2d')
    if (!ctx) return
    const k = EXPORT / PREVIEW
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, EXPORT, EXPORT)
    ctx.drawImage(img, g.dx * k, g.dy * k, g.w * k, g.h * k)
    out.toBlob(
      (blob) => {
        if (blob) onApply(blob)
      },
      'image/jpeg',
      0.9
    )
  }

  const { maxX, maxY } = maxPan()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Recortar foto</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} alignItems="center" sx={{ pt: 1 }}>
          <Box
            sx={{
              width: PREVIEW,
              height: PREVIEW,
              maxWidth: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'action.hover',
              touchAction: 'none',
            }}
          >
            <canvas
              ref={canvasRef}
              width={PREVIEW}
              height={PREVIEW}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                cursor: dims ? 'grab' : 'default',
                touchAction: 'none',
              }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary" textAlign="center">
            Arraste a imagem para ajustar o enquadramento ou use os controles.
          </Typography>

          <Box sx={{ width: '100%' }}>
            <Slider
              aria-label="Zoom"
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              onChange={(_, v) => setZoom(v as number)}
              disabled={!dims}
              sx={{ mt: 1 }}
            />
            <SliderLabel icon={<ZoomInRoundedIcon fontSize="small" />} text="Zoom" />

            <Slider
              aria-label="Horizontal"
              value={clamp(nx, -1, 1)}
              min={-1}
              max={1}
              step={0.01}
              onChange={(_, v) => setNx(v as number)}
              disabled={!dims || maxX <= 0}
              sx={{ mt: 2 }}
            />
            <SliderLabel icon={<SwapHorizRoundedIcon fontSize="small" />} text="Horizontal" />

            <Slider
              aria-label="Vertical"
              value={clamp(ny, -1, 1)}
              min={-1}
              max={1}
              step={0.01}
              onChange={(_, v) => setNy(v as number)}
              disabled={!dims || maxY <= 0}
              sx={{ mt: 2 }}
            />
            <SliderLabel icon={<SwapVertRoundedIcon fontSize="small" />} text="Vertical" />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleApply} variant="contained" disabled={!dims}>
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function SliderLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', mt: -0.5 }}>
      {icon}
      <Typography variant="caption">{text}</Typography>
    </Stack>
  )
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export default AvatarCropDialog
