import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// base './' → 어떤 경로에 올려도 동작. 앱(/)과 랜딩(/start/)을 함께 빌드해요.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: { app: resolve(__dirname, 'index.html'), start: resolve(__dirname, 'start/index.html') },
    },
  },
})
