import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://3.129.138.4',
      '/users': 'http://3.129.138.4',
      '/services': 'http://3.129.138.4',
      '/staff': 'http://3.129.138.4',
      '/reviews': 'http://3.129.138.4',
      '/appointments': 'http://3.129.138.4',
      '/salons': {
        target: 'http://3.129.138.4',
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
