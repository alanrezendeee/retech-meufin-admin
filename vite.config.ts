import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Em dev, /api/* vai para a meufin-api local (same-origin), como o nginx faz
  // em produção. Assim o cookie de sessão HttpOnly funciona sem CORS nem Domain.
  const apiProxyTarget = env.API_PROXY_TARGET || 'http://localhost:8002'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          // Mantém o Host do browser: a verificação CSRF da API compara Origin com Host.
          changeOrigin: false,
        },
      },
    },
  }
})
