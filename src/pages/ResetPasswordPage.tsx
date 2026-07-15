import { useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { isAxiosError } from 'axios'
import { AuthCardShell } from '@/components/auth/AuthCardShell'
import { confirmPasswordReset } from '@/lib/api/password-reset'

const schema = z
  .object({
    password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'As senhas não coincidem',
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])

  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    setLoading(true)
    try {
      await confirmPasswordReset(token, data.password)
      setDone(true)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        setError('Este link é inválido, expirou ou já foi utilizado. Solicite uma nova redefinição.')
      } else if (isAxiosError(err) && err.response?.status === 400) {
        setError('A nova senha deve ter no mínimo 8 caracteres.')
      } else {
        setError('Não foi possível redefinir a senha agora. Tente novamente em instantes.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <AuthCardShell>
        <Stack spacing={2} textAlign="center">
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Link inválido
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Este link de redefinição está incompleto. Solicite uma nova redefinição de senha.
          </Typography>
          <Button component={RouterLink} to="/forgot-password" variant="contained" fullWidth>
            Solicitar novo link
          </Button>
        </Stack>
      </AuthCardShell>
    )
  }

  if (done) {
    return (
      <AuthCardShell>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <CheckCircleRoundedIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Senha redefinida!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sua senha foi alterada com sucesso. Faça login com a nova senha.
          </Typography>
          <Button onClick={() => navigate('/login')} variant="contained" fullWidth sx={{ mt: 1 }}>
            Ir para o login
          </Button>
        </Stack>
      </AuthCardShell>
    )
  }

  return (
    <AuthCardShell>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
        Escolha a nova senha
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Crie uma senha forte com no mínimo 8 caracteres.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            {...register('password')}
            label="Nova senha"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            autoFocus
            error={!!errors.password}
            helperText={errors.password?.message}
            autoComplete="new-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            {...register('confirm')}
            label="Confirmar nova senha"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            error={!!errors.confirm}
            helperText={errors.confirm?.message}
            autoComplete="new-password"
          />

          <Button type="submit" variant="contained" color="primary" size="large" fullWidth disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </Stack>
      </form>
    </AuthCardShell>
  )
}
