import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline } from '@mui/material'
import App from './App'
import { AppThemeProvider } from './providers/AppThemeProvider'
import { ToastProvider } from './providers/ToastProvider'
import { AuthProvider } from '@/auth/context/jwt/auth-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppThemeProvider>
          <ToastProvider>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ToastProvider>
        </AppThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
