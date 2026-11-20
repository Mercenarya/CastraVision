import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  envDir: false,
  plugins: [react()],
  resolve: { alias: { '@': resolve(process.cwd(), 'src') } },
  test: {
    include: ['scripts/employee-ui.audit.jsx'], environment: 'jsdom',
    setupFiles: ['./src/test/setup.js', './scripts/employee-audit.transport.js'], testTimeout: 120000, hookTimeout: 30000,
    reporters: ['dot'],
  },
})
