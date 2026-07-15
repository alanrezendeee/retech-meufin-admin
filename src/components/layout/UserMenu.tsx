import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/context/jwt/auth-provider'
import { lp } from '@/theme/tokens'
import { myAvatarKey, useMyAvatar } from '@/hooks/useMyAvatar'
import { deleteMyAvatar, uploadMyAvatar } from '@/lib/api/profile'
import { AvatarCropDialog } from '@/components/common/AvatarCropDialog'

export function UserMenu() {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const open = Boolean(anchor)

  const { data: avatarUrl } = useMyAvatar()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?'

  const uploadAvatar = useMutation({
    mutationFn: (blob: Blob) => uploadMyAvatar(blob),
    onSuccess: () => qc.invalidateQueries({ queryKey: myAvatarKey }),
  })
  const removeAvatar = useMutation({
    mutationFn: () => deleteMyAvatar(),
    onSuccess: () => qc.invalidateQueries({ queryKey: myAvatarKey }),
  })

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    e.target.value = ''
    if (file) {
      setCropFile(file)
      setAnchor(null)
    }
  }

  const handleLogout = async () => {
    setAnchor(null)
    await logout()
    navigate('/login')
  }

  return (
    <>
      <IconButton
        onClick={(e) => setAnchor(e.currentTarget)}
        size="small"
        aria-label="Conta"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{
          p: 0.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Avatar
          src={avatarUrl ?? undefined}
          sx={{
            width: 36,
            height: 36,
            fontSize: '0.95rem',
            fontWeight: 700,
            bgcolor: lp.neon,
            color: lp.black,
          }}
        >
          {initial}
        </Avatar>
      </IconButton>
      <Menu
        id="account-menu"
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, mt: 1, borderRadius: 2 },
          },
        }}
      >
        <MenuItem disabled sx={{ opacity: '1 !important', py: 1.5 }}>
          <ListItemText
            primary={
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {user?.name}
              </Typography>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.email}
              </Typography>
            }
          />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
        >
          <ListItemIcon>
            <PhotoCameraRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Alterar foto de perfil" />
        </MenuItem>
        {avatarUrl && (
          <MenuItem
            onClick={() => {
              setAnchor(null)
              removeAvatar.mutate()
            }}
            disabled={removeAvatar.isPending}
          >
            <ListItemIcon>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Remover foto" />
          </MenuItem>
        )}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sair" />
        </MenuItem>
      </Menu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={onPickFile}
      />
      <AvatarCropDialog
        open={Boolean(cropFile)}
        imageFile={cropFile}
        onClose={() => setCropFile(null)}
        onApply={(blob) => {
          setCropFile(null)
          uploadAvatar.mutate(blob)
        }}
      />
    </>
  )
}
