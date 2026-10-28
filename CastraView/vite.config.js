import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const configDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(configDir, '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, 'VITE_')

  return {
    envDir: projectRoot,

    plugins: [react()],

    resolve: {
      alias: {
        '@': resolve(configDir, 'src'),
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