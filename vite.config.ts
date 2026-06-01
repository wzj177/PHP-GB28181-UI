import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [
      vue(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: env.VITE_APP_TITLE,
            amapKey: env.VITE_AMAP_KEY,
          }
        }
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3230,
      https: {
        key: './dev_certs/localhost+2-key.pem',
        cert: './dev_certs/localhost+2.pem'
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8886',
          changeOrigin: true
        }
      }
    }
  }
})