import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, fontFamily: (t) => t.typography.h4.fontFamily }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {action}
        </Stack>
      )}
    </Stack>
  )
}
