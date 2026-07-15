import { alpha, Avatar, Box, Divider, Typography } from '@mui/material'
import { useAuth } from '@/auth/context/jwt/auth-provider'
import { useMyAvatar } from '@/hooks/useMyAvatar'
import { colorTemplate } from '@/theme/colorTemplate'

const C = colorTemplate

function NeonLandscapeSvg() {
  const color = C.primary.main
  const stars: [number, number, number][] = [
    [18, 10, 0.55], [42, 6, 0.4], [70, 16, 0.65], [96, 5, 0.45],
    [128, 13, 0.5], [156, 8, 0.6], [183, 18, 0.4], [212, 6, 0.55],
    [234, 21, 0.45], [9, 24, 0.35], [60, 22, 0.3], [168, 26, 0.4],
  ]

  return (
    <svg
      viewBox="0 0 240 88"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: '100%' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="ucSkyGlow" cx="50%" cy="72%" r="55%">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={C.surface.app} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ucBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#040a04" />
          <stop offset="100%" stopColor="#070f07" />
        </linearGradient>
        <filter id="ucGlow" x="-30%" y="-100%" width="160%" height="400%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="240" height="88" fill="url(#ucBg)" />
      <rect width="240" height="88" fill="url(#ucSkyGlow)" />

      {/* Far mountains */}
      <path
        d="M0,88 L28,50 L52,63 L78,40 L108,56 L132,36 L158,52 L183,42 L208,58 L240,46 L240,88 Z"
        fill="#071007"
      />

      {/* Near hills */}
      <path
        d="M0,88 L18,70 L55,74 L88,62 L128,76 L162,64 L198,72 L240,66 L240,88 Z"
        fill="#091509"
      />

      {/* Horizon glow */}
      <ellipse cx="120" cy="62" rx="60" ry="10" fill={color} fillOpacity="0.07" />

      {/* Horizon line with glow */}
      <line
        x1="0" y1="62" x2="240" y2="62"
        stroke={color} strokeWidth="0.7" strokeOpacity="0.5"
        filter="url(#ucGlow)"
      />

      {/* Stars */}
      {stars.map(([x, y, op], i) => (
        <circle key={i} cx={x} cy={y} r="0.9" fill={color} fillOpacity={op} />
      ))}
    </svg>
  )
}

export function SidebarUserCard() {
  const { user } = useAuth()
  const { data: avatarUrl } = useMyAvatar()
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?'
  const color = C.primary.main

  return (
    <Box>
      {/* Traço superior com espaço */}
      <Divider sx={{ mb: 1.5, borderColor: 'divider' }} />

      <Box
        sx={{
          position: 'relative',
          borderRadius: '6px',
          overflow: 'hidden',
          border: `1px solid ${alpha(color, 0.2)}`,
          boxShadow: `0 0 20px -8px ${alpha(color, 0.2)}`,
        }}
      >
        {/* Illustration */}
        <Box sx={{ height: 88, display: 'block' }}>
          <NeonLandscapeSvg />
        </Box>

        {/* User info overlay — centralizado verticalmente no card */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            px: 1.5,
            background: `linear-gradient(to top, ${alpha(C.surface.app, 0.92)} 0%, ${alpha(C.surface.app, 0.55)} 60%, transparent 100%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
          }}
        >
          <Avatar
            src={avatarUrl ?? undefined}
            sx={{
              width: 34,
              height: 34,
              fontSize: '0.875rem',
              fontWeight: 700,
              bgcolor: alpha(color, 0.15),
              color: color,
              border: `1.5px solid ${alpha(color, 0.45)}`,
              flexShrink: 0,
            }}
          >
            {initial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              noWrap
              sx={{ color: 'text.primary', lineHeight: 1.35 }}
            >
              {user?.name ?? 'Usuário'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: color, opacity: 0.85, display: 'block', lineHeight: 1.3 }}
            >
              {user?.familyName ?? user?.email ?? 'Conta'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Traço inferior com espaço */}
      <Divider sx={{ mt: 1.5, mb: 2, borderColor: 'divider' }} />
    </Box>
  )
}
