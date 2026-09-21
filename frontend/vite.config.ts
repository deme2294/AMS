import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3034,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3034,
    },
    proxy: {
      // Proxy all /api requests to the backend (now on port 5006)
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: true,
        // Forward cookies back to browser properly
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              proxyRes.headers['set-cookie'] = setCookie.map((cookie: string) =>
                cookie
                  .replace(/;\s*Secure/gi, '')
                  .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                  .replace(/;\s*Domain=[^;]+/gi, '') // Strip Domain so it works on localhost
              );
            }
          });
        },
      },
      // Proxy /uploads so images load correctly
      '/uploads': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        secure: true,
      },
    },
  }

})

