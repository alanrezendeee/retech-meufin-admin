import { Box, CircularProgress } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/context/jwt/auth-provider'
import { RequireAuth } from '@/components/auth/RequireAuth'
import LoginPage from '@/pages/LoginPage'
import { useDynamicFavicon } from '@/hooks/useDynamicFavicon'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { DashboardIndexRoute } from '@/routes/sections/dashboard'
import { healthRoutes } from '@/routes/sections/health-routes'
import { financeRoutes } from '@/routes/sections/finance-routes'
import { adminRoutes } from '@/routes/sections/admin-routes'
import { vehicleRoutes } from '@/routes/sections/vehicles-routes'
import { patrimonyRoutes } from '@/routes/sections/patrimony-routes'
import { warrantyRoutes } from '@/routes/sections/warranties-routes'
import { educationRoutes } from '@/routes/sections/education-routes'
import { homeSafetyRoutes } from '@/routes/sections/homesafety-routes'

function App() {
  useDynamicFavicon()
  const { isAuthenticated, isInitialized } = useAuth()

  if (!isInitialized) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route element={<RequireAuth />}>
        <Route path="dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardIndexRoute />} />
          {healthRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {financeRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {adminRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {vehicleRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {patrimonyRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {warrantyRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {educationRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          {homeSafetyRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
