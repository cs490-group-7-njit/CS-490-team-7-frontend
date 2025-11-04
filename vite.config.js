import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/users': 'http://localhost:5000',
      '/services': 'http://localhost:5000',
      '/staff': 'http://localhost:5000',
      '/reviews': 'http://localhost:5000',
      '/appointments': 'http://localhost:5000',
      '/salons': {
        target: 'http://localhost:5000',
        bypass(req) {
          // Let React Router handle the /salons/search frontend route only
          if (req.url.startsWith('/salons/search')) {
            return req.url
          }
          // All other /salons/* requests should be proxied to the backend
        }
      }
    },
  },
})
