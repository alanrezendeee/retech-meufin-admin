import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material'
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { AuthCardShell } from '@/components/auth/AuthCardShell'
import { requestPasswordReset } from '@/lib/api/password-reset'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(data.email)
      setSent(true)
    } catch {
      setError('Não foi possível processar a solicitação agora. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthCardShell>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <MarkEmailReadRoundedIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Verifique seu e-mail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Se <strong>{getValues('email')}</strong> estiver cadastrado, você receberá um link para
            redefinir a senha em instantes. O link expira em 60 minutos.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Não chegou? Confira o spam ou solicite novamente.
          </Typography>
          <Button component={RouterLink} to="/login" variant="outlined" fullWidth sx={{ mt: 1 }}>
            Voltar para o login
          </Button>
        </Stack>
      </AuthCardShell>
    )
  }

  return (
    <AuthCardShell>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Esqueceu a senha?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informe o e-mail da sua conta e enviaremos um link para você escolher uma nova senha.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            {...register('email')}
            label="E-mail"
            type="email"
            fullWidth
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            autoComplete="email"
          />

          <Button type="submit" variant="contained" color="primary" size="large" fullWidth disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
              underline="hover"
              color="primary"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 16 }} /> Voltar para o login
            </Link>
          </Box>
        </Stack>
      </form>
    </AuthCardShell>
  )
}
