import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const configDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(configDir, '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, ['VITE_', 'SUPABASE_'])
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_KEY ||
    ''

  return {
    envDir: projectRoot,
    envPrefix: ['VITE_', 'SUPABASE_'],

    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey),
    },

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
