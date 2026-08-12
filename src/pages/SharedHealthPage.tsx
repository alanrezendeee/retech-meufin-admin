import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded'
import { useQuery } from '@tanstack/react-query'
import { getSharedPanels, type PanelMarker } from '@/features/health/api'
import {
  MarkerChartDialog,
  MiniMarkerCard,
  panelTitle,
} from '@/features/health/components/panels'
import { LoadingState } from '@/features/health/components/StateViews'
import { formatDateTimeBR } from '@/utils/dates'

/** Tempo restante legível ("23h 42min"); null se já expirou. */
function timeLeft(expiresAt: string): string | null {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return null
  const totalMin = Math.floor(ms / 60_000)
  const d = Math.floor(totalMin / (60 * 24))
  const h = Math.floor((totalMin % (60 * 24)) / 60)
  const min = totalMin % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${min}min`
  return `${min}min`
}

/**
 * Página PÚBLICA do link compartilhado (/compartilhado/:token): o médico vê
 * os painéis evolutivos do membro, somente leitura, sem login. Estados:
 * loading / válido / expirado.
 */
export default function SharedHealthPage() {
  const { token = '' } = useParams()
  const [openMarker, setOpenMarker] = useState<PanelMarker | null>(null)

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['shared-health', token],
    queryFn: () => getSharedPanels(token),
    retry: false,
  })

  const expired = isError && (error as Error).message === 'LINK_EXPIRED'
  const remaining = useMemo(
    () => (data ? timeLeft(data.link.expires_at) : null),
    [data]
  )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', py: 2, mb: 3 }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <MonitorHeartRoundedIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              MeuFin Saúde
            </Typography>
            <Typography variant="body2" color="text.secondary">
              · Dados compartilhados pelo paciente
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {isPending ? (
          <LoadingState label="Carregando dados compartilhados…" />
        ) : expired || isError ? (
          <Card sx={{ maxWidth: 520, mx: 'auto', mt: 6 }}>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Este link expirou ou foi revogado
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Solicite um novo link ao paciente para acessar os dados.
              </Typography>
            </CardContent>
          </Card>
        ) : data ? (
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {data.link.member_name}
                </Typography>
                {data.link.title && (
                  <Typography variant="body2" color="text.secondary">
                    {data.link.title}
                  </Typography>
                )}
              </Box>
              <Chip
                variant="outlined"
                color={remaining ? 'success' : 'default'}
                label={
                  remaining
                    ? `Expira em ${remaining} (${formatDateTimeBR(data.link.expires_at)})`
                    : 'Expirado'
                }
              />
            </Stack>

            <Alert severity="info" variant="outlined">
              Visualização somente leitura da evolução dos marcadores. Faixas verdes indicam o
              intervalo de referência informado pelo laboratório (ou curadoria do catálogo).
            </Alert>

            {data.panels.length === 0 ? (
              <Typography color="text.secondary">Nenhum resultado registrado ainda.</Typography>
            ) : (
              data.panels.map((panel) => (
                <Accordion key={panel.category} defaultExpanded disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography fontWeight={800}>
                      {panelTitle(panel.category)}{' '}
                      <Typography component="span" color="text.secondary">
                        ({panel.markers.length})
                      </Typography>
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1.5}>
                      {panel.markers.map((pm) => (
                        <Grid key={pm.marker.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                          <MiniMarkerCard
                            pm={pm}
                            density="compact"
                            onOpen={() => setOpenMarker(pm)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))
            )}

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', pt: 2 }}>
              Gerado pelo MeuFin — plataforma de organização familiar. Este link é temporário e
              pode ser revogado pelo paciente.
            </Typography>
          </Stack>
        ) : null}
      </Container>

      <MarkerChartDialog pm={openMarker} onClose={() => setOpenMarker(null)} />
    </Box>
  )
}
