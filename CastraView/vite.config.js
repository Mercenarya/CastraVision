import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const frontendRoot = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(frontendRoot, '..')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, 'VITE_')

  return {
    envDir: projectRoot,
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(frontendRoot, 'src'),
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target:
            process.env.VITE_API_PROXY_TARGET ||
            env.VITE_API_PROXY_TARGET ||
            'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
