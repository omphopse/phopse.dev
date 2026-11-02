import { defineConfig, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' } } as UserConfig & { test: { environment: string; setupFiles: string } })
