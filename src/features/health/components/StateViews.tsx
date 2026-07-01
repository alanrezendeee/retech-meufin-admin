import type { ReactNode } from 'react'
import { alpha, Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 8 }}>
      <CircularProgress size={32} />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <Box sx={{ py: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : undefined
        }
      >
        {message}
      </Alert>
    </Box>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{
        py: 8,
        px: 2,
        textAlign: 'center',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: (t) => alpha(t.palette.text.primary, t.palette.mode === 'dark' ? 0.03 : 0.02),
      }}
    >
      {icon && (
        <Box sx={{ color: 'text.disabled', '& svg': { fontSize: 48 } }}>{icon}</Box>
      )}
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Stack>
  )
}
