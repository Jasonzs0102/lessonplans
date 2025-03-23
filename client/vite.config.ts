import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: { overlay: false },
    watch: {
      usePolling: false,
    },
    open: true,
  },
  build: {
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
  },
})
