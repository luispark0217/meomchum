import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' → 어떤 경로에 올려도 동작 (Vercel 루트, 하위 폴더 모두)
export default defineConfig({ plugins: [react()], base: './' })
