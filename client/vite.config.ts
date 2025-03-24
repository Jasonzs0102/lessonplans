import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      threshold: 10240, // 10KB以上的文件才会被压缩
    })
  ],
  server: {
    port: 3000,
    hmr: { overlay: false },
    watch: {
      usePolling: false,
    },
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'react-markdown']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096, // 4KB以下的资源会被内联
    reportCompressedSize: false, // 禁用压缩大小报告，提高构建速度
    assetsDir: 'assets', // 静态资源目录
    emptyOutDir: true, // 构建前清空输出目录
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'react-markdown'],
    exclude: ['@babel/runtime']
  },
  // 添加基本路径配置，支持子路径部署
  base: '/'
})
