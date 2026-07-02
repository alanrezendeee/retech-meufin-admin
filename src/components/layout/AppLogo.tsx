import { alpha, Box, Typography, type SxProps, type Theme } from '@mui/material'
import { APP_NAME, BRAND_SUFFIX } from '@/constants/app'
import { lp } from '@/theme/tokens'

type Props = {
  compact?: boolean
  sx?: SxProps<Theme>
}

/**
 * Marca do Meu Fin: casa (família) com linha de crescimento dentro (finanças).
 * SVG próprio para não depender de ícone genérico de gráfico.
 */
export function BrandMark({ size = 20, color = lp.neon }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* telhado */}
      <path d="M4.4 10.6 12 4.4l7.6 6.2" />
      {/* paredes */}
      <path d="M6.4 12v5.4a1.8 1.8 0 0 0 1.8 1.8h7.6a1.8 1.8 0 0 0 1.8-1.8V12" />
      {/* crescimento dentro de casa */}
      <path d="m9 15.7 2-2 1.5 1.4 2.5-2.7" />
      <path d="M13.3 12.4H15v1.8" />
    </svg>
  )
}

export function AppLogo({ compact, sx }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 1 : 1.25,
        textDecoration: 'none',
        color: 'inherit',
        ...sx,
      }}
      component="div"
    >
      <Box
        sx={{
          width: compact ? 28 : 32,
          height: compact ? 28 : 32,
          borderRadius: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: `linear-gradient(135deg, ${alpha(lp.neon, 0.16)} 0%, ${alpha(lp.neonDim, 0.1)} 100%)`,
          border: `1px solid ${alpha(lp.neon, 0.3)}`,
          boxShadow: `0 0 16px -8px ${alpha(lp.neon, 0.45)}`,
        }}
      >
        <BrandMark size={compact ? 17 : 19} />
      </Box>
      {!compact && (
        <Box>
          <Typography
            component="span"
            sx={{
              fontFamily: (t) => t.typography.h6.fontFamily,
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
              color: 'text.primary',
            }}
          >
            {APP_NAME}
            <Typography
              component="span"
              sx={{
                ml: 0.75,
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: lp.neonBright,
              }}
            >
              {BRAND_SUFFIX}
            </Typography>
          </Typography>
        </Box>
      )}
    </Box>
  )
}
