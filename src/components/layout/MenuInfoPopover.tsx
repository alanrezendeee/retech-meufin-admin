import { useState, type MouseEvent } from 'react'
import { Box, Divider, IconButton, Popover, Stack, Typography, alpha } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import { businessRules, type BusinessRuleBlock } from '@/layouts/business-rules'

function RuleBlock({ block }: { block: BusinessRuleBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {block.text}
        </Typography>
      )
    case 'list':
      return (
        <Stack component="ul" spacing={0.6} sx={{ m: 0, pl: 2 }}>
          {block.items.map((it, i) => (
            <Typography key={i} component="li" variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
              {it}
            </Typography>
          ))}
        </Stack>
      )
    case 'code':
      return (
        <Box
          component="pre"
          sx={{
            m: 0,
            px: 1.2,
            py: 0.8,
            borderRadius: 1.5,
            bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
            fontSize: '0.78rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            overflowX: 'auto',
          }}
        >
          {block.text}
        </Box>
      )
    case 'callout': {
      const warning = block.tone === 'warning'
      const Icon = warning ? WarningAmberRoundedIcon : LightbulbOutlinedIcon
      const color = warning ? 'warning' : 'info'
      return (
        <Box
          sx={(t) => ({
            display: 'flex',
            gap: 1,
            p: 1.2,
            borderRadius: 1.5,
            bgcolor: alpha(t.palette[color].main, 0.1),
            border: `1px solid ${alpha(t.palette[color].main, 0.25)}`,
          })}
        >
          <Icon fontSize="small" color={color} sx={{ mt: '2px', flexShrink: 0 }} />
          <Box>
            <Typography variant="caption" fontWeight={700} display="block">
              {block.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
              {block.text}
            </Typography>
          </Box>
        </Box>
      )
    }
    default:
      return null
  }
}

/**
 * Ícone ⓘ ao lado do item de menu; ao passar o mouse, abre um popover com a
 * regra de negócio (padrão BioPass). Conteúdo vem de `businessRules[ruleKey]`.
 */
export function MenuInfoPopover({ ruleKey }: { ruleKey: string }) {
  const rule = businessRules[ruleKey]
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  if (!rule) return null
  const open = Boolean(anchorEl)
  const RuleIcon = rule.icon

  const swallow = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={`Regra: ${rule.title}`}
        onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
        onMouseLeave={() => setAnchorEl(null)}
        onClick={swallow}
        sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        sx={{ pointerEvents: 'none' }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: 'auto',
              maxWidth: 360,
              p: 2,
              ml: 1,
              borderRadius: 2,
              boxShadow: 6,
            },
          },
        }}
        disableRestoreFocus
      >
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1} alignItems="center">
            {RuleIcon && <RuleIcon fontSize="small" color="primary" />}
            <Typography variant="subtitle2" fontWeight={700}>
              {rule.title}
            </Typography>
          </Stack>
          <Divider />
          {rule.blocks.map((block, i) => (
            <RuleBlock key={i} block={block} />
          ))}
        </Stack>
      </Popover>
    </>
  )
}
