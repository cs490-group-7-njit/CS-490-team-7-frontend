import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/users': 'http://localhost:5000',
      '/salons': 'http://localhost:5000',
      '/services': 'http://localhost:5000',
      '/staff': 'http://localhost:5000',
      '/reviews': 'http://localhost:5000',
    },
  },
})
