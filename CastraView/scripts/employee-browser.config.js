import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Isolated audit only: never load the application's hosted .env configuration.
export default defineConfig({
  envDir: false,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(process.cwd(), 'src') } },
  server: { host: '127.0.0.1', port: 61400, strictPort: true },
})
