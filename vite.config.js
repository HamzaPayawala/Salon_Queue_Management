import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite needs no localhost URLs in production config; the dev server uses its own defaults.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
